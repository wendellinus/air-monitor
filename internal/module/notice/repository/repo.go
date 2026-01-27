package repository

import (
	"context"
	"go-pratice/internal/module/notice/model"
	"time"

	"gorm.io/gorm"
)

type INoticeRepo interface {
	Create(ctx context.Context, notice *model.Notice) error
	GetActiveNotices(ctx context.Context) ([]*model.Notice, error)
}

// 接口实现检查
var _ INoticeRepo = (*NoticeRepo)(nil)

type NoticeRepo struct {
	db *gorm.DB
}

func NewNoticeRepo(db *gorm.DB) *NoticeRepo {
	return &NoticeRepo{
		db: db,
	}
}

func (repo *NoticeRepo) Create(ctx context.Context, notice *model.Notice) error {
	return repo.db.WithContext(ctx).Create(notice).Error
}

func (repo *NoticeRepo) GetActiveNotices(ctx context.Context) ([]*model.Notice, error) {
	var notices []*model.Notice
	now := time.Now()

	err := repo.db.WithContext(ctx).Where("status = ?", model.StatusPublished).Where("start_time <= ?", now).Where("end_time >= ?", now).Order("created_at desc").Find(&notices).Error

	return notices, err
}
