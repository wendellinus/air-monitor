package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一返回结构
type Response struct {
	Code int         `json:"code"` // 0:成功, 非0:错误
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// Success 成功响应 (data 可以传 nil)
func Success(c *gin.Context, data interface{}) {
	if data == nil {
		data = gin.H{} // 保证 data 不为 null
	}
	c.JSON(http.StatusOK, Response{
		Code: 0,
		Msg:  "success",
		Data: data,
	})
}

// Fail 失败响应
func Fail(c *gin.Context, code int, msg string) {
	c.JSON(http.StatusOK, Response{
		Code: code,
		Msg:  msg,
		Data: gin.H{},
	})
}
