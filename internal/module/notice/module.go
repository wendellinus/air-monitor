package notice

import (
	"go-pratice/internal/module/notice/api"
	"go-pratice/internal/module/notice/model"
	"go-pratice/internal/module/notice/repository"
	"go-pratice/internal/module/notice/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

/*
1. 结构体
2. 工厂模式
3. 注册方法
*/

type Module struct {
	handler *api.NoticeHandler
	Service service.INoticeService // 暴露 Service 供定时任务使用
}

func NewModule(db *gorm.DB, alertProvider service.IAlertProvider, logger *zap.Logger) *Module {
	// 模块自迁移
	if err := db.AutoMigrate(&model.Notice{}); err != nil {
		panic("Notice 模块数据库迁移失败: " + err.Error())
	}

	repo := repository.NewNoticeRepo(db)
	svc := service.NewNoticeService(repo, alertProvider, logger)
	hdl := api.NewNoticeHandler(svc)
	return &Module{
		handler: hdl,
		Service: svc,
	}
}

func (m *Module) RegisterRoutes(public, private *gin.RouterGroup) {
	noticeGroup := public.Group("/notice")
	noticeGroup.GET("/active", m.handler.GetActiveNotices)
}
