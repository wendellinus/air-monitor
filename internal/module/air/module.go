package air

import (
	"go-pratice/internal/infra/thirdparty/qweather"
	"go-pratice/internal/module/air/api"
	"go-pratice/internal/module/air/repository"
	"go-pratice/internal/module/air/service"
	cityRepository "go-pratice/internal/module/city/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	handler *api.AirHandler
}

func NewModule(db *gorm.DB, qweatherRepo *qweather.QWeatherRepo) *Module {
	repo := repository.NewAirRepo(db)
	cityRepo := cityRepository.NewCityRepo(db)
	svc := service.NewAirService(repo, cityRepo, qweatherRepo)
	hdl := api.NewAirHandler(svc)
	return &Module{handler: hdl}
}

func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	airGroup := public.Group("/air")
	{
		airGroup.GET("/now", m.handler.GetRealtimeAQI)
	}
}
