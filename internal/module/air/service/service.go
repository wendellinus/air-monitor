package service

import (
	"context"
	"fmt"
	"go-pratice/internal/module/air/model"
	cityModel "go-pratice/internal/module/city/model"
	"go-pratice/pkg/global"
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
}

// AirService 空气质量业务逻辑
type AirService struct {
	repo        IAirRepo
	cityRepo    ICityRepo
	airProvider IAirProvider
}

func NewAirService(repo IAirRepo, cityRepo ICityRepo, airProvider IAirProvider) *AirService {
	return &AirService{
		repo:        repo,
		cityRepo:    cityRepo,
		airProvider: airProvider,
	}
}

// GetRealtimeAQI 获取实时空气质量
func (s *AirService) GetRealtimeAQI(ctx context.Context, cityID string) (*model.AirQualityLog, error) {
	// 1. 查缓存 (TODO: Redis)
	
	// 2. 获取城市坐标 (新版 API 需要经纬度)
	city, err := s.cityRepo.GetByCityID(ctx, cityID)
	if err != nil {
		global.LOG.Error(fmt.Sprintf("[Air] Failed to get city info for cityID: %s, error: %v", cityID, err))
		return nil, fmt.Errorf("city not found or error: %w", err)
	}

	// 3. 查 API
	global.LOG.Info(fmt.Sprintf("[Air] Fetching AQI from API for city: %s (%s, %s)", city.Name, city.Lat, city.Lon))
	data, err := s.airProvider.FetchAQI(ctx, city.Lat, city.Lon)
	if err != nil {
		global.LOG.Warn(fmt.Sprintf("[Air] API failed (%v), trying fallback to DB...", err))
		// 降级：查数据库最近一条
		if latest, dbErr := s.repo.GetLatestByCityID(ctx, cityID); dbErr == nil {
			global.LOG.Info("[Air] Found latest data in DB (Fallback)")
			return latest, nil
		}
		return nil, err
	}

	// 补全 CityID (API 返回中可能没有)
	data.CityID = cityID

	// 4. 异步入库
	go func() {
		_ = s.repo.Create(context.Background(), data)
		global.LOG.Info("[Air] Saved AQI data to DB")
	}()

	return data, nil
}
