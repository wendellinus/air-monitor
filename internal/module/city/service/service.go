package service

import (
	"context"
	"fmt"
	"go-pratice/internal/module/city/model"
	"go-pratice/pkg/global"
)

// ICityRepo 定义数据库操作接口
type ICityRepo interface {
	Create(ctx context.Context, city *model.City) error
	GetByCityID(ctx context.Context, cityID string) (*model.City, error)
	SearchByName(ctx context.Context, name string) ([]model.City, error)
}

// IGeoProvider 定义外部 Geo 服务接口 (如和风天气)
type IGeoProvider interface {
	FetchGeo(ctx context.Context, keyword string) ([]model.City, error)
	GetTopCities(ctx context.Context, rangeType string, number int) ([]model.City, error)
}

// CityService 城市业务逻辑服务
// 职责：协调数据库查询与 Provider 调用
// 注意：缓存逻辑已移至 Provider 装饰器层，Service 无需关心
type CityService struct {
	repo        ICityRepo
	geoProvider IGeoProvider
}

// NewCityService 创建城市服务
func NewCityService(repo ICityRepo, geoProvider IGeoProvider) *CityService {
	return &CityService{
		repo:        repo,
		geoProvider: geoProvider,
	}
}

// SearchCity 搜索城市：先查库，无结果则查 API 并入库
func (s *CityService) SearchCity(ctx context.Context, keyword string) ([]model.City, error) {
	// 1. 查库
	cities, err := s.repo.SearchByName(ctx, keyword)
	if err == nil && len(cities) > 0 {
		global.LOG.Info(fmt.Sprintf("[City] 在数据库中找到 %d 个城市，关键词: %s", len(cities), keyword))
		return cities, nil
	}

	// 2. 调用 Provider 获取数据
	global.LOG.Info(fmt.Sprintf("[City] 数据库未找到，正在从 API 获取，关键词: %s", keyword))
	remoteCities, err := s.geoProvider.FetchGeo(ctx, keyword)
	if err != nil {
		return nil, err
	}

	// 3. 异步入库
	go func() {
		bgCtx := context.Background()
		for _, city := range remoteCities {
			_ = s.repo.Create(bgCtx, &city)
		}
		global.LOG.Info(fmt.Sprintf("[City] 已保存 %d 个城市到数据库", len(remoteCities)))
	}()

	return remoteCities, nil
}

// GetTopCities 获取热门城市
// 缓存由 Provider 装饰器透明处理
func (s *CityService) GetTopCities(ctx context.Context, rangeType string, number int) ([]model.City, error) {
	// 处理默认值
	if rangeType == "" {
		rangeType = "world"
	}
	if number <= 0 {
		number = 10
	}

	// 调用 Provider (缓存在装饰器层处理)
	global.LOG.Debug(fmt.Sprintf("[City] 获取热门城市: %s, %d", rangeType, number))
	return s.geoProvider.GetTopCities(ctx, rangeType, number)
}
