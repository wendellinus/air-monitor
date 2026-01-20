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
}

// CityService 城市业务逻辑服务
type CityService struct {
	repo        ICityRepo
	geoProvider IGeoProvider
}

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
		global.LOG.Info(fmt.Sprintf("[City] Found %d cities in DB for keyword: %s", len(cities), keyword))
		return cities, nil
	}

	// 2. 查 API
	global.LOG.Info(fmt.Sprintf("[City] Not found in DB, fetching from API for keyword: %s", keyword))
	remoteCities, err := s.geoProvider.FetchGeo(ctx, keyword)
	if err != nil {
		return nil, err
	}

	// 3. 异步入库 (简化版，实际应考虑去重和批量插入)
	// 这里为了演示简单，只插入第一个，或者遍历插入
	// 在工业级代码中，建议使用消息队列或异步任务处理
	go func() {
		// 创建一个新的 Context 避免请求取消导致入库失败
		bgCtx := context.Background()
		for _, city := range remoteCities {
			_ = s.repo.Create(bgCtx, &city)
		}
		global.LOG.Info(fmt.Sprintf("[City] Saved %d cities to DB", len(remoteCities)))
	}()

	return remoteCities, nil
}
