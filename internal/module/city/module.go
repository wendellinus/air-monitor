package city

import (
	"go-pratice/internal/infra/thirdparty/qweather"
	"go-pratice/internal/module/city/api"
	"go-pratice/internal/module/city/repository"
	"go-pratice/internal/module/city/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	handler *api.CityHandler
}

func NewModule(db *gorm.DB, qweatherRepo *qweather.QWeatherRepo) *Module {
	repo := repository.NewCityRepo(db)
	svc := service.NewCityService(repo, qweatherRepo)
	hdl := api.NewCityHandler(svc)
	return &Module{handler: hdl}
}

func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	cityGroup := public.Group("/city")
	{
		cityGroup.GET("/search", m.handler.SearchCity)
	}
}
