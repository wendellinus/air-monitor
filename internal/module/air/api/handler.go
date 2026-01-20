package api

import (
	"go-pratice/internal/module/air/service"
	"net/http"

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
	cityID := c.Query("city_id")
	if cityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city_id is required"})
		return
	}

	data, err := h.srv.GetRealtimeAQI(c.Request.Context(), cityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}
