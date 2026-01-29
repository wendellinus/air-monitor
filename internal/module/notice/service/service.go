package service

import (
	"context"
	"go-pratice/internal/infra/thirdparty/qweather"
	"go-pratice/internal/module/notice/model"
	"go-pratice/internal/module/notice/repository"
	"time"

	"go.uber.org/zap"
)

/*
  1. 定义抽象能力
  2. 定义结构体
  3. 工厂模式
  4. 具体方法实现
*/

// IAlertProvider 预警数据提供者接口（由 qweather.Provider 实现）
type IAlertProvider interface {
	FetchWeatherAlert(ctx context.Context, lat, lon string) (*qweather.WeatherAlert, error)
}

type INoticeService interface {
	GetActiveNotices(ctx context.Context) ([]*model.Notice, error)
	SyncWeatherAlerts(ctx context.Context, lat, lon string) (int, error) // 返回新增数量
}

type NoticeService struct {
	repo          repository.INoticeRepo
	alertProvider IAlertProvider
	logger        *zap.Logger
}

var _ INoticeService = (*NoticeService)(nil)

func NewNoticeService(repo repository.INoticeRepo, alertProvider IAlertProvider, logger *zap.Logger) *NoticeService {
	return &NoticeService{
		repo:          repo,
		alertProvider: alertProvider,
		logger:        logger,
	}
}

func (s *NoticeService) GetActiveNotices(ctx context.Context) ([]*model.Notice, error) {
	return s.repo.GetActiveNotices(ctx)
}

// SyncWeatherAlerts 从和风天气获取预警并同步到 Notice 表
func (s *NoticeService) SyncWeatherAlerts(ctx context.Context, lat, lon string) (int, error) {
	// 1. 获取预警数据
	alertData, err := s.alertProvider.FetchWeatherAlert(ctx, lat, lon)
	if err != nil {
		s.logger.Error("获取天气预警失败", zap.Error(err))
		return 0, err
	}

	// 2. 检查是否有预警
	if alertData.Metadata.ZeroResult || len(alertData.Alerts) == 0 {
		s.logger.Info("当前无预警信息", zap.String("lat", lat), zap.String("lon", lon))
		return 0, nil
	}

	// 3. 遍历预警，去重后入库
	var created int
	for _, alert := range alertData.Alerts {
		// 去重检查
		exists, err := s.repo.ExistsByAlertID(ctx, alert.Id)
		if err != nil {
			s.logger.Warn("检查预警是否存在失败", zap.String("alertId", alert.Id), zap.Error(err))
			continue
		}
		if exists {
			s.logger.Debug("预警已存在，跳过", zap.String("alertId", alert.Id))
			continue
		}

		// 转换为 Notice
		notice := s.alertToNotice(alert)

		// 入库
		if err := s.repo.Create(ctx, notice); err != nil {
			s.logger.Error("保存预警通知失败", zap.String("alertId", alert.Id), zap.Error(err))
			continue
		}

		created++
		s.logger.Info("新增预警通知", zap.String("alertId", alert.Id), zap.String("title", notice.Title))
	}

	return created, nil
}

// alertToNotice 将和风预警转换为 Notice 实体
func (s *NoticeService) alertToNotice(alert qweather.Alert) *model.Notice {
	// 解析时间
	startTime := time.Now()
	endTime := time.Now().Add(24 * time.Hour) // 默认 24 小时后过期

	if alert.EffectiveTime != nil {
		if t, err := qweather.ParseISOTime(*alert.EffectiveTime); err == nil {
			startTime = t
		}
	}
	if alert.ExpireTime != nil {
		if t, err := qweather.ParseISOTime(*alert.ExpireTime); err == nil {
			endTime = t
		}
	}

	// 组装内容
	content := alert.Description
	if alert.Instruction != nil && *alert.Instruction != "" {
		content += "\n\n【防御指南】\n" + *alert.Instruction
	}

	// 严重程度映射到 Level
	level := model.LevelInfo
	if alert.Severity != nil {
		switch *alert.Severity {
		case "severe", "extreme":
			level = model.LevelUrgent
		}
	}

	// 颜色代码
	var colorCode *string
	if alert.Color.Code != "" {
		colorCode = &alert.Color.Code
	}

	return &model.Notice{
		Title:     alert.Headline,
		Content:   content,
		StartTime: startTime,
		EndTime:   endTime,
		Status:    model.StatusPublished, // 预警直接发布
		Level:     level,
		AlertID:   &alert.Id,
		EventType: &alert.EventType.Name,
		Severity:  alert.Severity,
		ColorCode: colorCode,
		Source:    model.SourceQWeather,
	}
}
