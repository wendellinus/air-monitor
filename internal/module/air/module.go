package air

import (
	"go-pratice/internal/module/air/api"
	airModel "go-pratice/internal/module/air/model"
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
	if err := db.AutoMigrate(&airModel.AirQualityLog{}); err != nil {
		panic("Air 模块数据库创建失败：" + err.Error())
	}
	repo := repository.NewAirRepo(db)
	cityRepo := cityRepository.NewCityRepo(db)
	// 注入 Named Logger，日志中会自动携带 "logger": "air" 字段
	// 注意：缓存逻辑已移至 Provider 装饰器，Service 不再需要 Redis
	svc := service.NewAirService(repo, cityRepo, airProvider, global.LOG.Named("air"))
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
