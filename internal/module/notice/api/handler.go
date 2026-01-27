package api

import (
	"go-pratice/internal/module/notice/service"
	"go-pratice/pkg/common/response"

	"github.com/gin-gonic/gin"
)

/**
1. 定义结构体
2. 工厂模式
3. GetActiveNotices
*/

type NoticeHandler struct {
	srv service.INoticeService
}

func NewNoticeHandler(srv service.INoticeService) *NoticeHandler {
	return &NoticeHandler{srv: srv}
}

func (h *NoticeHandler) GetActiveNotices(c *gin.Context) {
	/*
		1. 从 service 获取数据
		2. 返回给前端
	*/
	activeNotices, err := h.srv.GetActiveNotices(c.Request.Context())
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}
	response.Success(c, activeNotices)

}
