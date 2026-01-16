package router

import (
	"go-pratice/internal/api"

	"github.com/gin-gonic/gin"
)

type UserRouter struct {
	api *api.UserApi
}

func NewUserRouter(api *api.UserApi) *UserRouter {
	return &UserRouter{api: api}
}

// InitUserRoutes 注册用户相关路由
func (r *UserRouter) InitUserRoutes(public *gin.RouterGroup, private *gin.RouterGroup) {
	// 公开路由
	public.POST("/register", r.api.Register)
	public.POST("/login", r.api.Login)

	// 私有路由 (已包含 JWT 中间件)
	private.GET("/user/me", r.api.GetUserInfo)
	private.POST("/logout", r.api.Logout)
	private.GET("/users", r.api.GetUserInfo)
}
