package air

import (
	"go-pratice/internal/module/air/api"
	"go-pratice/internal/module/air/repository"
	"go-pratice/internal/module/air/service"
	cityRepository "go-pratice/internal/module/city/repository"
	"go-pratice/pkg/global"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Module struct {
	handler *api.AirHandler
}

func NewModule(db *gorm.DB, airProvider service.IAirProvider) *Module {
	repo := repository.NewAirRepo(db)
	cityRepo := cityRepository.NewCityRepo(db)
	// 注入 Named Logger，日志中会自动携带 "logger": "air" 字段
	svc := service.NewAirService(repo, cityRepo, airProvider, global.REDIS, global.LOG.Named("air"))
	hdl := api.NewAirHandler(svc)
	return &Module{handler: hdl}
}

func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	airGroup := public.Group("/air")
	{
		airGroup.GET("/now", m.handler.GetRealtimeAQI)
		airGroup.GET("/hourly", m.handler.GetHourlyAQI)
		airGroup.GET("/daily", m.handler.GetDailyAQI)
	}
}
