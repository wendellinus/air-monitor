package provider

import (
	"go-pratice/internal/module/provider/api"
	"go-pratice/internal/module/provider/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Module 类型定义 构造器定义
type Module struct {
	handler *api.Handler
}

// NewModule 工厂模式
func NewModule(p service.IProvider, log *zap.Logger) *Module {
	srv := service.NewService(p, log)
	handler := api.NewHandler(srv)
	return &Module{handler: handler}
}

func (module *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	providerGroup := private.Group("/provider")
	{
		providerGroup.GET("/summary", module.handler.GetSummary)
		providerGroup.GET("/stats", module.handler.GetStats)
	}
}
