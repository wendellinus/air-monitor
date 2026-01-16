package router

import (
	"go-pratice/internal/api"

	"github.com/gin-gonic/gin"
)

type WsRouter struct {
	api *api.WsApi
}

func NewWsRouter(api *api.WsApi) *WsRouter {
	return &WsRouter{api: api}
}

// InitWsRoutes 注册 WebSocket 相关路由
func (r *WsRouter) InitWsRoutes(public *gin.RouterGroup) {
	public.GET("/ws", r.api.Connect)
}
