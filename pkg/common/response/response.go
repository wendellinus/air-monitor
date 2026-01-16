package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 定义业务状态码
const (
	SUCCESS = 0 // 成功
	ERROR   = 7 // 一般性错误
)

// Response 响应结构体
type Response struct {
	Code int         `json:"code"` // 业务码
	Data interface{} `json:"data"` // 数据 (泛型，类似 TS 的 any)
	Msg  string      `json:"msg"`  // 消息
}

// Result 基础响应方法
// httpStatus: HTTP 协议状态码 (200, 400, 500)
func Result(httpStatus int, code int, data interface{}, msg string, c *gin.Context) {
	c.JSON(httpStatus, Response{
		Code: code,
		Data: data,
		Msg:  msg,
	})
}

// Ok 成功 - 无数据
func Ok(c *gin.Context) {
	Result(http.StatusOK, SUCCESS, map[string]interface{}{}, "操作成功", c)
}

// OkWithMessage 成功 - 自定义消息
func OkWithMessage(message string, c *gin.Context) {
	Result(http.StatusOK, SUCCESS, map[string]interface{}{}, message, c)
}

// OkWithData 成功 - 带数据
func OkWithData(data interface{}, c *gin.Context) {
	Result(http.StatusOK, SUCCESS, data, "操作成功", c)
}

// OkWithDetailed 成功 - 带数据和消息
func OkWithDetailed(data interface{}, message string, c *gin.Context) {
	Result(http.StatusOK, SUCCESS, data, message, c)
}

// Fail 失败 - 一般错误
func Fail(c *gin.Context) {
	Result(http.StatusOK, ERROR, map[string]interface{}{}, "操作失败", c)
}

// FailWithMessage 失败 - 自定义消息
func FailWithMessage(message string, c *gin.Context) {
	// 注意：这里我们依然返回 HTTP 200，但是业务码是 7 (ERROR)
	// 这样前端 Axios 拦截器依然会进入 .then()，需要根据 res.data.code 判断业务逻辑
	Result(http.StatusOK, ERROR, map[string]interface{}{}, message, c)
}

// FailWithDetailed 失败 - 带数据和消息
func FailWithDetailed(data interface{}, message string, c *gin.Context) {
	Result(http.StatusOK, ERROR, data, message, c)
}
