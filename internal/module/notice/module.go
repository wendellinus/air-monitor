package notice

import (
	"go-pratice/internal/module/notice/api"
	"go-pratice/internal/module/notice/model"
	"go-pratice/internal/module/notice/repository"
	"go-pratice/internal/module/notice/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/*
1. 结构体
2. 工厂模式
3. 注册方法
*/

type Module struct {
	handler *api.NoticeHandler
}

func NewModule(db *gorm.DB) *Module {
	// 模块自迁移
	if err := db.AutoMigrate(&model.Notice{}); err != nil {
		panic("Notice 模块数据库迁移失败: " + err.Error())
	}

	repo := repository.NewNoticeRepo(db)
	svc := service.NewNoticeService(repo)
	hdl := api.NewNoticeHandler(svc)
	return &Module{handler: hdl}
}

func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	noticeGroup := public.Group("/notice")
	noticeGroup.GET("/active", m.handler.GetActiveNotices)
}
