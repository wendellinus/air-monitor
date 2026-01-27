package router

import (
	"go-pratice/internal/middleware"

	"github.com/gin-gonic/gin"
)

type IModule interface {
	RegisterRoutes(public, private *gin.RouterGroup)
}

// NewRouter 初始化总路由
// 接收所有模块作为参数，只负责路由注册，不负责创建依赖
func NewRouter(
	modules ...IModule,
) *gin.Engine {
	r := gin.Default()

	// 1. 全局中间件
	r.Use(middleware.Cors())

	// 2. 路由分组
	publicGroup := r.Group("/api/v1")
	privateGroup := r.Group("/api/v1")
	privateGroup.Use(middleware.JWTAuth())

	// 3. 注册各模块路由
	for _, m := range modules {
		m.RegisterRoutes(publicGroup, privateGroup)
	}

	return r
}
