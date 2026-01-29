package qweather

import (
	"context"
	"fmt"
	"time"

	"github.com/goccy/go-json"
	"go.uber.org/zap"

	"go-pratice/internal/infra/cache"
	airModel "go-pratice/internal/module/air/model"
	cityModel "go-pratice/internal/module/city/model"
	providerModel "go-pratice/internal/module/provider/model"
)

// 注意：编译时接口检查已移至 provider.go 中，避免循环导入
// CachedProvider 实现了以下接口：
// - airService.IAirProvider
// - cityService.IGeoProvider
// - providerService.IProvider
// - noticeService.IAlertProvider

// CacheConfig 缓存 TTL 配置（已解析为 time.Duration）
type CacheConfig struct {
	AirRealtimeTTL  time.Duration
	AirHourlyTTL    time.Duration
	AirDailyTTL     time.Duration
	WeatherAlertTTL time.Duration
	TopCitiesTTL    time.Duration
}

// CachedProvider 带缓存的 Provider 装饰器
// 使用装饰器模式包装原始 Provider，透明添加缓存能力
// 实现与 Provider 相同的接口，Service 层无需感知缓存存在
type CachedProvider struct {
	provider *Provider    // 被装饰的原始 Provider
	cache    cache.Cache  // 缓存抽象
	config   CacheConfig  // TTL 配置
	log      *zap.Logger
}

// NewCachedProvider 创建带缓存的 Provider
func NewCachedProvider(provider *Provider, c cache.Cache, config CacheConfig, log *zap.Logger) *CachedProvider {
	return &CachedProvider{
		provider: provider,
		cache:    c,
		config:   config,
		log:      log,
	}
}

// ============================================================================
// 空气质量相关接口 (带缓存)
// ============================================================================

// FetchAQI 获取实时空气质量 (带缓存)
func (p *CachedProvider) FetchAQI(ctx context.Context, lat, lon string) (*airModel.AirQualityLog, error) {
	key := fmt.Sprintf("air:realtime:%s:%s", lat, lon)

	// 1. 尝试从缓存获取
	if data, err := p.cache.Get(ctx, key); err == nil {
		var result airModel.AirQualityLog
		if err := json.Unmarshal(data, &result); err == nil {
			p.log.Debug("缓存命中", zap.String("key", key))
			return &result, nil
		}
		p.log.Warn("缓存反序列化失败", zap.String("key", key), zap.Error(err))
	}

	// 2. 缓存未命中，调用原始 Provider
	result, err := p.provider.FetchAQI(ctx, lat, lon)
	if err != nil {
		return nil, err
	}

	// 3. 异步写入缓存
	go p.setCache(key, result, p.config.AirRealtimeTTL)

	return result, nil
}

// FetchHourlyAQI 获取逐小时空气质量预报 (带缓存)
func (p *CachedProvider) FetchHourlyAQI(ctx context.Context, lat, lon string) ([]*airModel.HourlyAQI, error) {
	key := fmt.Sprintf("air:hourly:%s:%s", lat, lon)

	if data, err := p.cache.Get(ctx, key); err == nil {
		var result []*airModel.HourlyAQI
		if err := json.Unmarshal(data, &result); err == nil {
			p.log.Debug("缓存命中", zap.String("key", key))
			return result, nil
		}
		p.log.Warn("缓存反序列化失败", zap.String("key", key), zap.Error(err))
	}

	result, err := p.provider.FetchHourlyAQI(ctx, lat, lon)
	if err != nil {
		return nil, err
	}

	go p.setCache(key, result, p.config.AirHourlyTTL)
	return result, nil
}

// FetchDailyAQI 获取逐天空气质量预报 (带缓存)
func (p *CachedProvider) FetchDailyAQI(ctx context.Context, lat, lon string) ([]*airModel.DailyAQI, error) {
	key := fmt.Sprintf("air:daily:%s:%s", lat, lon)

	if data, err := p.cache.Get(ctx, key); err == nil {
		var result []*airModel.DailyAQI
		if err := json.Unmarshal(data, &result); err == nil {
			p.log.Debug("缓存命中", zap.String("key", key))
			return result, nil
		}
		p.log.Warn("缓存反序列化失败", zap.String("key", key), zap.Error(err))
	}

	result, err := p.provider.FetchDailyAQI(ctx, lat, lon)
	if err != nil {
		return nil, err
	}

	go p.setCache(key, result, p.config.AirDailyTTL)
	return result, nil
}

// ============================================================================
// 天气预警接口 (带缓存)
// ============================================================================

// FetchWeatherAlert 获取天气预警 (带缓存)
func (p *CachedProvider) FetchWeatherAlert(ctx context.Context, lat, lon string) (*WeatherAlert, error) {
	key := fmt.Sprintf("weather:alert:%s:%s", lat, lon)

	if data, err := p.cache.Get(ctx, key); err == nil {
		var result WeatherAlert
		if err := json.Unmarshal(data, &result); err == nil {
			p.log.Debug("缓存命中", zap.String("key", key))
			return &result, nil
		}
		p.log.Warn("缓存反序列化失败", zap.String("key", key), zap.Error(err))
	}

	result, err := p.provider.FetchWeatherAlert(ctx, lat, lon)
	if err != nil {
		return nil, err
	}

	go p.setCache(key, result, p.config.WeatherAlertTTL)
	return result, nil
}

// ============================================================================
// 城市相关接口 (带缓存)
// ============================================================================

// FetchGeo 城市搜索 (不缓存，因为关键词变化大)
func (p *CachedProvider) FetchGeo(ctx context.Context, keyword string) ([]cityModel.City, error) {
	return p.provider.FetchGeo(ctx, keyword)
}

// GetTopCities 获取热门城市 (带缓存)
func (p *CachedProvider) GetTopCities(ctx context.Context, rangeType string, number int) ([]cityModel.City, error) {
	key := fmt.Sprintf("city:top:%s:%d", rangeType, number)

	if data, err := p.cache.Get(ctx, key); err == nil {
		var result []cityModel.City
		if err := json.Unmarshal(data, &result); err == nil {
			p.log.Debug("缓存命中", zap.String("key", key))
			return result, nil
		}
		p.log.Warn("缓存反序列化失败", zap.String("key", key), zap.Error(err))
	}

	result, err := p.provider.GetTopCities(ctx, rangeType, number)
	if err != nil {
		return nil, err
	}

	go p.setCache(key, result, p.config.TopCitiesTTL)
	return result, nil
}

// ============================================================================
// Provider 相关接口 (不缓存，实时性要求高)
// ============================================================================

// FetchSummary 财务汇总 (不缓存)
func (p *CachedProvider) FetchSummary(ctx context.Context) (*providerModel.Summary, error) {
	return p.provider.FetchSummary(ctx)
}

// FetchStats 请求量统计 (不缓存)
func (p *CachedProvider) FetchStats(ctx context.Context) (*providerModel.Stats, error) {
	return p.provider.FetchStats(ctx)
}

// ============================================================================
// 内部辅助方法
// ============================================================================

// setCache 通用缓存写入 (异步调用，不阻塞主流程)
func (p *CachedProvider) setCache(key string, value any, ttl time.Duration) {
	if ttl <= 0 {
		return // TTL 无效时跳过缓存
	}

	data, err := json.Marshal(value)
	if err != nil {
		p.log.Warn("缓存序列化失败", zap.String("key", key), zap.Error(err))
		return
	}

	if err := p.cache.Set(context.Background(), key, data, ttl); err != nil {
		p.log.Warn("缓存写入失败", zap.String("key", key), zap.Error(err))
	}
}
