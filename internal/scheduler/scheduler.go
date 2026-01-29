package scheduler

import (
	"context"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"go-pratice/internal/config"
	cityModel "go-pratice/internal/module/city/model"
)

// ============================================================================
// 接口定义 (遵循依赖倒置原则)
// ============================================================================

// TopCitiesProvider 热门城市数据提供者接口
// 调度器只依赖这个接口，不依赖具体的 CachedProvider 实现
type TopCitiesProvider interface {
	// GetTopCities 获取热门城市
	// 调用此方法会触发缓存刷新
	GetTopCities(ctx context.Context, rangeType string, number int) ([]cityModel.City, error)
}

// ============================================================================
// 调度器实现
// ============================================================================

// Scheduler 定时任务调度器
type Scheduler struct {
	cron     *cron.Cron
	provider TopCitiesProvider // 依赖接口，非具体实现
	config   config.CacheRefreshConfig
	log      *zap.Logger
}

// New 创建调度器
func New(provider TopCitiesProvider, cfg config.CacheRefreshConfig, log *zap.Logger) *Scheduler {
	return &Scheduler{
		cron:     cron.New(cron.WithSeconds()), // 支持秒级精度
		provider: provider,
		config:   cfg,
		log:      log,
	}
}

// Start 启动定时任务
func (s *Scheduler) Start() {
	// 检查是否启用
	if !s.config.Enabled {
		s.log.Info("缓存刷新任务未启用")
		return
	}

	// 检查配置
	if s.config.Schedule == "" {
		s.log.Warn("缓存刷新任务未配置 schedule，使用默认值 @every 50m")
		s.config.Schedule = "0 */50 * * * *"
	}

	if len(s.config.Regions) == 0 {
		s.log.Warn("缓存刷新任务未配置 regions，使用默认值")
		s.config.Regions = []config.RegionConfig{
			{Name: "cn", Count: 20},
			{Name: "world", Count: 10},
		}
	}

	// 注册定时任务
	_, err := s.cron.AddFunc(s.config.Schedule, s.refreshTopCities)
	if err != nil {
		s.log.Error("添加缓存刷新任务失败", zap.Error(err))
		return
	}

	s.log.Info("定时任务已注册",
		zap.String("task", "refreshTopCities"),
		zap.String("schedule", s.config.Schedule),
		zap.Int("regions", len(s.config.Regions)),
	)

	s.cron.Start()
	s.log.Info("定时任务调度器已启动")
}

// Stop 停止定时任务
func (s *Scheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
	s.log.Info("定时任务调度器已停止")
}

// refreshTopCities 刷新热门城市缓存
func (s *Scheduler) refreshTopCities() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	s.log.Info("开始刷新热门城市缓存...", zap.Int("regions", len(s.config.Regions)))

	successCount := 0
	for _, region := range s.config.Regions {
		if _, err := s.provider.GetTopCities(ctx, region.Name, region.Count); err != nil {
			s.log.Warn("刷新热门城市失败",
				zap.String("region", region.Name),
				zap.Int("count", region.Count),
				zap.Error(err),
			)
		} else {
			s.log.Debug("刷新热门城市成功",
				zap.String("region", region.Name),
				zap.Int("count", region.Count),
			)
			successCount++
		}
	}

	s.log.Info("热门城市缓存刷新完成",
		zap.Int("success", successCount),
		zap.Int("total", len(s.config.Regions)),
	)
}
