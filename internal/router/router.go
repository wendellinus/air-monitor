package router

import (
	"go-pratice/internal/api"
	"go-pratice/internal/middleware"
	"go-pratice/internal/repository"
	"go-pratice/internal/service"
	"go-pratice/pkg/global"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化总路由
func InitRouter() *gin.Engine {
	r := gin.Default()

	// 1. 依赖注入 (DI)
	userRepo := repository.NewUserRepository(global.DB)
	userService := service.NewUserService(userRepo)
	userApi := api.NewUserApi(userService)
	wsApi := api.NewWsApi()

	// 2. 初始化子路由
	userRouter := NewUserRouter(userApi)
	wsRouter := NewWsRouter(wsApi)

	// 3. 定义根路由组
	// Group 1: 公开路由 (无需登录)
	publicGroup := r.Group("/api/v1")

	// Group 2: 私有路由 (需要登录)
	privateGroup := r.Group("/api/v1")
	privateGroup.Use(middleware.JWTAuth())

	// 4. 注册路由
	userRouter.InitUserRoutes(publicGroup, privateGroup)
	wsRouter.InitWsRoutes(publicGroup)

	return r
}
