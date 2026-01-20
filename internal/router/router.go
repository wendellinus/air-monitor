package router

import (
	"go-pratice/internal/middleware"
	"go-pratice/internal/module/air"
	"go-pratice/internal/module/city"
	"go-pratice/internal/module/user"
	"go-pratice/internal/module/websocket"

	"github.com/gin-gonic/gin"
)

// NewRouter 初始化总路由
// 接收所有模块作为参数，只负责路由注册，不负责创建依赖
func NewRouter(
	userMod *user.Module,
	cityMod *city.Module,
	airMod *air.Module,
	wsMod *websocket.Module,
) *gin.Engine {
	r := gin.Default()

	// 1. 全局中间件
	r.Use(middleware.Cors())

	// 2. 路由分组
	publicGroup := r.Group("/api/v1")
	privateGroup := r.Group("/api/v1")
	privateGroup.Use(middleware.JWTAuth())

	// 3. 注册各模块路由
	userMod.RegisterRoutes(publicGroup, privateGroup)
	cityMod.RegisterRoutes(publicGroup, privateGroup)
	airMod.RegisterRoutes(publicGroup, privateGroup)
	wsMod.RegisterRoutes(publicGroup)

	return r
}
