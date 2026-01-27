package user

import (
	"go-pratice/internal/module/user/api"
	"go-pratice/internal/module/user/model"
	"go-pratice/internal/module/user/repository"
	"go-pratice/internal/module/user/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Module User 模块入口
type Module struct {
	handler *api.UserApi
}

// NewModule 初始化 User 模块
func NewModule(db *gorm.DB) *Module {
	if e := db.AutoMigrate(&model.User{}); e != nil {
		panic("User 模块数据库创建失败：" + e.Error())
	}
	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	hdl := api.NewUserApi(svc)
	return &Module{handler: hdl}
}

// RegisterRoutes 注册路由
func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	// 复用原有的路由逻辑，或者直接在这里写
	// 这里直接写，替代原有的 router.go
	// 公开路由
	public.POST("/register", m.handler.Register)
	public.POST("/login", m.handler.Login)

	// 私有路由 (已包含 JWT 中间件)
	private.GET("/user/me", m.handler.GetUserInfo)
	private.POST("/logout", m.handler.Logout)
	private.GET("/users", m.handler.GetUserInfo)
	private.GET("/user/token-info", m.handler.GetTokenInfo) // 调试接口：查看token信息
}
