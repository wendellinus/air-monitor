package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"go-pratice/internal/module/city/model"
	"go-pratice/pkg/global"
	"time"

	"github.com/redis/go-redis/v9"
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
type CityService struct {
	repo        ICityRepo
	geoProvider IGeoProvider
	redis       *redis.Client
}

func NewCityService(repo ICityRepo, geoProvider IGeoProvider, redis *redis.Client) *CityService {
	return &CityService{
		repo:        repo,
		geoProvider: geoProvider,
		redis:       redis,
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

	// 2. 查 API
	global.LOG.Info(fmt.Sprintf("[City] 数据库未找到，正在从 API 获取，关键词: %s", keyword))
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
		global.LOG.Info(fmt.Sprintf("[City] 已保存 %d 个城市到数据库", len(remoteCities)))
	}()

	return remoteCities, nil
}

func (s *CityService) GetTopCities(ctx context.Context, rangeType string, number int) ([]model.City, error) {
	// 1. 处理默认值
	if rangeType == "" {
		rangeType = "world"
	}
	if number <= 0 {
		number = 10
	}

	// 2. 定义缓存 Key (格式: city:top:范围:数量)
	cacheKey := fmt.Sprintf("city:top:%s:%d", rangeType, number)

	// 3. 尝试从 Redis 获取
	val, err := s.redis.Get(ctx, cacheKey).Result()
	if err == nil {
		// 3.1 缓存命中 (Hit)
		var cities []model.City
		if err := json.Unmarshal([]byte(val), &cities); err == nil {
			global.LOG.Info(fmt.Sprintf("[Cache] 缓存命中 key: %s", cacheKey))
			return cities, nil
		}
		// 如果反序列化失败，记录日志并继续走下游（不中断业务）
		global.LOG.Error(fmt.Sprintf("[Cache] 反序列化失败: %v", err))
	} else if !errors.Is(err, redis.Nil) {
		// Redis 报错（非 Key 不存在），记录日志但不中断
		global.LOG.Error(fmt.Sprintf("[Cache] Redis 错误: %v", err))
	}

	// 4. 缓存未命中 (Miss)，调用 Provider (API)
	global.LOG.Info(fmt.Sprintf("[API] 请求热门城市: %s, %d", rangeType, number))
	cities, err := s.geoProvider.GetTopCities(ctx, rangeType, number)
	if err != nil {
		return nil, err
	}

	// 5. 写入 Redis (异步执行，不阻塞主流程)
	// 这里的 context.Background() 确保即使请求结束，缓存写入也能完成
	go func() {
		data, err := json.Marshal(cities)
		if err == nil {
			// 设置 1 小时过期
			if err := s.redis.Set(context.Background(), cacheKey, data, time.Hour).Err(); err != nil {
				global.LOG.Error(fmt.Sprintf("[Cache] 写入缓存失败: %v", err))
			}
		}
	}()

	return cities, nil
}
