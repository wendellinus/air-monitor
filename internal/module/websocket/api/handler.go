package api

import (
	"go-pratice/pkg/global"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type WsApi struct{}

func NewWsApi() *WsApi {
	return &WsApi{}
}

// upgrader 配置 WebSocket 升级参数
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// 允许跨域
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Connect WebSocket 连接处理 (Echo 模式)
func (a *WsApi) Connect(c *gin.Context) {
	// 1. 升级 HTTP 连接为 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		global.LOG.Error("WebSocket 升级失败", zap.Error(err))
		return
	}
	defer conn.Close()

	global.LOG.Info("WebSocket 客户端已连接", zap.String("ip", c.ClientIP()))

	// 2. 读写循环
	for {
		// 读取消息
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			global.LOG.Warn("WebSocket 读取错误或连接断开", zap.Error(err))
			break
		}

		global.LOG.Info("收到消息", zap.String("message", string(p)))

		// 模拟业务处理：回显消息 (Echo)
		// 可以在这里加上时间戳或者其他逻辑
		responseMsg := []byte("Server received: " + string(p) + " at " + time.Now().Format(time.DateTime))

		// 发送消息
		if err := conn.WriteMessage(messageType, responseMsg); err != nil {
			global.LOG.Error("WebSocket 发送失败", zap.Error(err))
			break
		}
	}
}
