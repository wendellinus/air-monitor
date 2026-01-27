package api

import (
	"go-pratice/internal/module/provider/service"
	"go-pratice/pkg/common/response"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *service.Service
}

func NewHandler(service *service.Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (handler *Handler) GetSummary(c *gin.Context) {
	data, err := handler.service.GetSummary(c.Request.Context())
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}

	response.Success(c, data)
}

func (handler *Handler) GetStats(c *gin.Context) {
	data, err := handler.service.GetStats(c.Request.Context())
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}
	response.Success(c, data)
}
