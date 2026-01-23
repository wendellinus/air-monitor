package api

import (
	"go-pratice/internal/module/air/service"
	"go-pratice/pkg/common/response"

	"github.com/gin-gonic/gin"
)

type AirHandler struct {
	srv *service.AirService
}

func NewAirHandler(srv *service.AirService) *AirHandler {
	return &AirHandler{srv: srv}
}

// GetRealtimeAQI 获取实时空气质量
// @Summary 获取实时空气质量
// @Param city_id query string true "城市ID"
// @Success 200 {object} model.AirQualityLog
// @Router /api/v1/air/now [get]
func (h *AirHandler) GetRealtimeAQI(c *gin.Context) {
	var req struct {
		CityID string `form:"city_id" binding:"required"`
	}

	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.CodeParamError, "city_id 是必填的")
		return
	}

	data, err := h.srv.GetRealtimeAQI(c.Request.Context(), req.CityID)
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}

	response.Success(c, data)
}

// GetHourlyAQI 获取小时级空气质量预报
// @Summary 获取小时级空气质量预报
// @Param city_id query string true "城市ID"
// @Success 200 {array} model.AirQualityLog
// @Router /api/v1/air/hourly [get]
func (h *AirHandler) GetHourlyAQI(c *gin.Context) {
	var req struct {
		CityID string `form:"city_id" binding:"required"`
	}

	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.CodeParamError, "city_id 是必填的")
		return
	}

	data, err := h.srv.GetHourlyAQI(c.Request.Context(), req.CityID)
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}

	response.Success(c, data)
}

func (h *AirHandler) GetDailyAQI(c *gin.Context) {
	var req struct {
		CityID string `form:"city_id" binding:"required"`
	}

	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.CodeParamError, "city_id 是必填的")
		return
	}

	data, err := h.srv.GetDailyAQI(c.Request.Context(), req.CityID)
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}

	response.Success(c, data)
}
