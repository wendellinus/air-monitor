package city

import (
	"go-pratice/internal/module/city/api"
	"go-pratice/internal/module/city/model"
	"go-pratice/internal/module/city/repository"
	"go-pratice/internal/module/city/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	handler *api.CityHandler
}

func NewModule(db *gorm.DB, geoProvider service.IGeoProvider) *Module {
	if err := db.AutoMigrate(&model.City{}); err != nil {
		panic("City 模块数据库创建失败：" + err.Error())
	}
	repo := repository.NewCityRepo(db)
	// 注意：缓存逻辑已移至 Provider 装饰器，Service 不再需要 Redis
	svc := service.NewCityService(repo, geoProvider)
	hdl := api.NewCityHandler(svc)
	return &Module{handler: hdl}
}

func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	cityGroup := public.Group("/city")
	{
		cityGroup.GET("/search", m.handler.SearchCity)
		cityGroup.GET("/top", m.handler.GetTopCities)
	}
}
