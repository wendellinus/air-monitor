package service

import (
	"context"
	"errors"
	"fmt"
	"go-pratice/internal/module/air/model"
	cityModel "go-pratice/internal/module/city/model"
	"go-pratice/pkg/global"
	"time"

	"github.com/goccy/go-json"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// IAirRepo 定义数据库操作接口
type IAirRepo interface {
	Create(ctx context.Context, log *model.AirQualityLog) error
	GetLatestByCityID(ctx context.Context, cityID string) (*model.AirQualityLog, error)
}

// ICityRepo 定义城市数据接口 (依赖倒置)
type ICityRepo interface {
	GetByCityID(ctx context.Context, cityID string) (*cityModel.City, error)
}

// IAirProvider 定义外部空气质量服务接口
type IAirProvider interface {
	FetchAQI(ctx context.Context, lat, lon string) (*model.AirQualityLog, error)
	FetchHourlyAQI(ctx context.Context, lat, lon string) ([]*model.AirQualityLog, error)
}

// AirService 空气质量业务逻辑
type AirService struct {
	repo        IAirRepo
	cityRepo    ICityRepo
	airProvider IAirProvider
	redis       *redis.Client
	log         *zap.Logger
}

func NewAirService(repo IAirRepo, cityRepo ICityRepo, airProvider IAirProvider, redis *redis.Client, log *zap.Logger) *AirService {
	return &AirService{
		repo:        repo,
		cityRepo:    cityRepo,
		airProvider: airProvider,
		redis:       redis,
		log:         log,
	}
}

// GetRealtimeAQI 获取实时空气质量
func (s *AirService) GetRealtimeAQI(ctx context.Context, cityID string) (*model.AirQualityLog, error) {
	// 1. 查缓存 (TODO: Redis)

	// 2. 获取城市坐标 (新版 API 需要经纬度)
	city, err := s.cityRepo.GetByCityID(ctx, cityID)
	if err != nil {
		s.log.Error("获取城市信息失败", zap.String("cityID", cityID), zap.Error(err))
		return nil, fmt.Errorf("未找到城市或查询错误: %w", err)
	}

	// 3. 查 API
	s.log.Info("正在从 API 获取 AQI", zap.String("city", city.Name), zap.String("lat", city.Lat), zap.String("lon", city.Lon))
	data, err := s.airProvider.FetchAQI(ctx, city.Lat, city.Lon)
	if err != nil {
		s.log.Warn("API 请求失败, 尝试降级查询数据库", zap.Error(err))
		// 降级：查数据库最近一条
		if latest, dbErr := s.repo.GetLatestByCityID(ctx, cityID); dbErr == nil {
			s.log.Info("在数据库中找到最新数据 (降级)")
			return latest, nil
		}
		return nil, err
	}

	// 补全 CityID (API 返回中可能没有)
	data.CityID = cityID

	// 4. 异步入库
	go func() {
		_ = s.repo.Create(context.Background(), data)
		s.log.Info("AQI 数据已保存至数据库")
	}()

	return data, nil
}

// GetHourlyAQI 获取小时级空气质量预报
func (s *AirService) GetHourlyAQI(ctx context.Context, cityID string) ([]*model.AirQualityLog, error) {
	// 1. 获取城市坐标
	city, err := s.cityRepo.GetByCityID(ctx, cityID)
	if err != nil {
		s.log.Error("获取城市信息失败", zap.String("cityID", cityID), zap.Error(err))
		return nil, fmt.Errorf("未找到城市或查询错误: %w", err)
	}

	// 定义缓存 key
	cacheKey := fmt.Sprintf("air:hourly:%s", cityID)

	// 尝试从 Redis 获取数据
	val, err := s.redis.Get(ctx, cacheKey).Result()
	if err == nil {
		// 缓存命中
		var hourlyAQI []*model.AirQualityLog
		if err := json.Unmarshal([]byte(val), &hourlyAQI); err == nil {
			s.log.Info("缓存命中", zap.String("key", cacheKey))
			return hourlyAQI, nil
		}
		s.log.Error("反序列化失败", zap.Error(err))
	} else if !errors.Is(err, redis.Nil) {
		// Redis 报错（非 Key 不存在），记录日志但不中断
		s.log.Error("Redis 错误", zap.Error(err))
	}

	// 2. 查 API
	s.log.Info("正在从 API 获取逐小时 AQI", zap.String("city", city.Name), zap.String("lat", city.Lat), zap.String("lon", city.Lon))
	data, err := s.airProvider.FetchHourlyAQI(ctx, city.Lat, city.Lon)
	if err != nil {
		s.log.Error("逐小时 API 请求失败", zap.Error(err))
		return nil, err
	}

	// 3. 补全 CityID (先补全，确保缓存的数据也是完整的)
	for _, log := range data {
		log.CityID = cityID
	}

	// 4. 异步写入缓存
	go func() {
		bytesData, err := json.Marshal(data)
		if err == nil {
			if err := s.redis.Set(context.Background(), cacheKey, string(bytesData), time.Hour).Err(); err != nil {
				s.log.Error("写入缓存失败", zap.Error(err))
			}
		} else {
			s.log.Error("序列化失败", zap.Error(err))
		}
	}()

	return data, nil
}
