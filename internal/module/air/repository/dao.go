package repository

import (
	"context"
	"go-pratice/internal/module/air/model"
	"go-pratice/internal/module/air/service"


	"gorm.io/gorm"
)

type AirRepo struct {
	db *gorm.DB
}

var _ service.IAirRepo = (*AirRepo)(nil)

func NewAirRepo(db *gorm.DB) *AirRepo {
	return &AirRepo{
		db: db,
	}
}

func (r *AirRepo) Create(ctx context.Context, log *model.AirQualityLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *AirRepo) GetLatestByCityID(ctx context.Context, cityID string) (*model.AirQualityLog, error) {
	var log model.AirQualityLog
	// 获取最新一条
	err := r.db.WithContext(ctx).Where("city_id = ?", cityID).Order("pub_time desc").First(&log).Error
	return &log, err
}
