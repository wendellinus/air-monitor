package websocket

import (
	"go-pratice/internal/module/websocket/api"

	"github.com/gin-gonic/gin"
)

type Module struct {
	handler *api.WsApi
}

func NewModule() *Module {
	hdl := api.NewWsApi()
	return &Module{handler: hdl}
}

func (m *Module) RegisterRoutes(public *gin.RouterGroup) {
	public.GET("/ws", m.handler.Connect)
}
