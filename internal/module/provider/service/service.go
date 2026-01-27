package service

import (
	"context"
	"go-pratice/internal/module/provider/model"

	"go.uber.org/zap"
)

type IProvider interface {
	FetchSummary(ctx context.Context) (*model.Summary, error)
	FetchStats(ctx context.Context) (*model.Stats, error)
}

type Service struct {
	provider IProvider
	log      *zap.Logger
}

func NewService(provider IProvider, log *zap.Logger) *Service {
	return &Service{
		provider: provider,
		log:      log,
	}
}

func (s *Service) GetSummary(ctx context.Context) (*model.Summary, error) {
	summary, err := s.provider.FetchSummary(ctx)
	if err != nil {
		s.log.Warn("财务汇总 API 请求失败", zap.Error(err))
		return nil, err
	}

	return summary, nil
}

func (s *Service) GetStats(ctx context.Context) (*model.Stats, error) {
	stats, err := s.provider.FetchStats(ctx)
	if err != nil {
		s.log.Warn("请求量统计 API 请求失败", zap.Error(err))
		return nil, err
	}

	return stats, nil
}
