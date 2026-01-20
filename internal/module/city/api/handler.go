package api

import (
	"go-pratice/internal/module/city/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CityHandler struct {
	srv *service.CityService
}

func NewCityHandler(srv *service.CityService) *CityHandler {
	return &CityHandler{srv: srv}
}

// SearchCity 搜索城市
// @Summary 搜索城市
// @Param keyword query string true "关键词"
// @Success 200 {object} []model.City
// @Router /api/v1/city/search [get]
func (h *CityHandler) SearchCity(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keyword is required"})
		return
	}

	cities, err := h.srv.SearchCity(c.Request.Context(), keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cities})
}
