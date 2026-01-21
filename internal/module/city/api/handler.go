package api

import (
	"go-pratice/internal/module/city/service"
	"go-pratice/pkg/common/response"

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
	var req struct {
		Keyword string `form:"keyword" binding:"required"`
	}

	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.CodeParamError, "关键词不能为空")
		return
	}

	cities, err := h.srv.SearchCity(c.Request.Context(), req.Keyword)
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}

	response.Success(c, cities)
}

func (h *CityHandler) GetTopCities(c *gin.Context) {
	// 定义请求参数结构
	var req struct {
		RangeType string `form:"rangeType" binding:"omitempty,oneof=world cn us"` // 对应 ?rangeType=...
		Number    int    `form:"number" binding:"omitempty,min=1,max=50"`         // 对应 ?number=... 自动转 int
	}

	// 自动绑定：Gin 会自动读取 Query 参数，并把字符串转成 int
	// 如果转换失败，它会返回 error
	if err := c.ShouldBindQuery(&req); err != nil {
		response.Fail(c, response.CodeParamError, "参数无效")
		return
	}

	// 直接使用 req.RangeType 和 req.Number
	cities, err := h.srv.GetTopCities(c.Request.Context(), req.RangeType, req.Number)
	if err != nil {
		response.Fail(c, response.CodeThirdParty, err.Error())
		return
	}

	response.Success(c, cities)
}
