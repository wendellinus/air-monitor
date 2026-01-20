package repository

import (
	"context"
	"go-pratice/internal/module/city/model"
	"go-pratice/internal/module/city/service"


	"gorm.io/gorm"
)

type CityRepo struct {
	db *gorm.DB
}

// 确保实现了接口
var _ service.ICityRepo = (*CityRepo)(nil)

func NewCityRepo(db *gorm.DB) *CityRepo {
	return &CityRepo{
		db: db,
	}
}

func (r *CityRepo) Create(ctx context.Context, city *model.City) error {
	return r.db.WithContext(ctx).Create(city).Error
}

func (r *CityRepo) GetByCityID(ctx context.Context, cityID string) (*model.City, error) {
	var city model.City
	err := r.db.WithContext(ctx).Where("city_id = ?", cityID).First(&city).Error
	return &city, err
}

func (r *CityRepo) SearchByName(ctx context.Context, name string) ([]model.City, error) {
	var cities []model.City
	// 模糊查询
	err := r.db.WithContext(ctx).Where("name LIKE ?", "%"+name+"%").Find(&cities).Error
	return cities, err
}
