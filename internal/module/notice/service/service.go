package service

import (
	"context"
	"go-pratice/internal/module/notice/model"
	"go-pratice/internal/module/notice/repository"
)

/*
	1. 定义抽象能力
	2. 定义结构体
	3. 工厂模式
	4. 具体方法实现
*/

type INoticeService interface {
	GetActiveNotices(ctx context.Context) ([]*model.Notice, error)
}

type NoticeService struct {
	repo repository.INoticeRepo
}

var _ INoticeService = (*NoticeService)(nil)

func NewNoticeService(repo repository.INoticeRepo) *NoticeService {
	return &NoticeService{repo: repo}
}

func (s *NoticeService) GetActiveNotices(ctx context.Context) ([]*model.Notice, error) {
	/**
	1. 数据库拿数据
	2. 业务逻辑（可选）
	3. 返回
	*/
	activeNotices, err := s.repo.GetActiveNotices(ctx)
	if err != nil {
		return nil, err
	}
	return activeNotices, nil
}
