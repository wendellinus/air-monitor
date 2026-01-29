package service

import (
	"context"
	"fmt"
	"go-pratice/internal/module/air/model"
	cityModel "go-pratice/internal/module/city/model"

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
	FetchHourlyAQI(ctx context.Context, lat, lon string) ([]*model.HourlyAQI, error)
	FetchDailyAQI(ctx context.Context, lat, lon string) ([]*model.DailyAQI, error)
}

// AirService 空气质量业务逻辑
// 职责：协调城市查询、调用 Provider、补全数据、持久化
// 注意：缓存逻辑已移至 Provider 装饰器层，Service 无需关心
type AirService struct {
	repo        IAirRepo
	cityRepo    ICityRepo
	airProvider IAirProvider
	log         *zap.Logger
}

// NewAirService 创建空气质量服务
func NewAirService(repo IAirRepo, cityRepo ICityRepo, airProvider IAirProvider, log *zap.Logger) *AirService {
	return &AirService{
		repo:        repo,
		cityRepo:    cityRepo,
		airProvider: airProvider,
		log:         log,
	}
}

// GetRealtimeAQI 获取实时空气质量
func (s *AirService) GetRealtimeAQI(ctx context.Context, cityID string) (*model.AirQualityLog, error) {
	// 1. 获取城市坐标
	city, err := s.cityRepo.GetByCityID(ctx, cityID)
	if err != nil {
		s.log.Error("获取城市信息失败", zap.String("cityID", cityID), zap.Error(err))
		return nil, fmt.Errorf("未找到城市或查询错误: %w", err)
	}

	// 2. 调用 Provider 获取数据 (缓存由 Provider 装饰器透明处理)
	s.log.Debug("获取实时 AQI", zap.String("city", city.Name))
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

	// 3. 补全 CityID
	data.CityID = cityID

	// 4. 异步入库
	go func() {
		if err := s.repo.Create(context.Background(), data); err != nil {
			s.log.Warn("AQI 数据入库失败", zap.Error(err))
		}
	}()

	return data, nil
}

// GetHourlyAQI 获取逐小时空气质量预报
func (s *AirService) GetHourlyAQI(ctx context.Context, cityID string) ([]*model.HourlyAQI, error) {
	// 1. 获取城市坐标
	city, err := s.cityRepo.GetByCityID(ctx, cityID)
	if err != nil {
		s.log.Error("获取城市信息失败", zap.String("cityID", cityID), zap.Error(err))
		return nil, fmt.Errorf("未找到城市或查询错误: %w", err)
	}

	// 2. 调用 Provider 获取数据 (缓存由 Provider 装饰器透明处理)
	s.log.Debug("获取逐小时 AQI", zap.String("city", city.Name))
	data, err := s.airProvider.FetchHourlyAQI(ctx, city.Lat, city.Lon)
	if err != nil {
		s.log.Error("逐小时 API 请求失败", zap.Error(err))
		return nil, err
	}

	// 3. 补全 CityID
	for _, log := range data {
		log.CityID = cityID
	}

	return data, nil
}

// GetDailyAQI 获取逐天空气质量预报
func (s *AirService) GetDailyAQI(ctx context.Context, cityID string) ([]*model.DailyAQI, error) {
	// 1. 获取城市坐标
	city, err := s.cityRepo.GetByCityID(ctx, cityID)
	if err != nil {
		s.log.Error("获取城市信息失败", zap.String("cityID", cityID), zap.Error(err))
		return nil, fmt.Errorf("未找到城市或查询错误: %w", err)
	}

	// 2. 调用 Provider 获取数据 (缓存由 Provider 装饰器透明处理)
	s.log.Debug("获取逐天 AQI", zap.String("city", city.Name))
	data, err := s.airProvider.FetchDailyAQI(ctx, city.Lat, city.Lon)
	if err != nil {
		s.log.Error("逐天 API 请求失败", zap.Error(err))
		return nil, err
	}

	// 3. 补全 CityID
	for _, log := range data {
		log.CityID = cityID
	}

	return data, nil
}
