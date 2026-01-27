package bootstrap

import (
	"context"
	"fmt"
	"go-pratice/internal/infra/thirdparty/qweather"
	"go-pratice/internal/initialize"
	"go-pratice/internal/module/air"
	"go-pratice/internal/module/city"
	"go-pratice/internal/module/notice"
	"go-pratice/internal/module/provider"
	"go-pratice/internal/module/user"
	"go-pratice/internal/module/websocket"
	"go-pratice/internal/router"
	"go-pratice/pkg/global"
	"net"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Run 启动应用
func Run() {
	// 1. System Init (Config / Logger / DB / Redis)
	initSystem()

	// 2. Infra Init (Third-party Clients)
	qweatherProvider := initInfra()

	// 3. Module Assemble (Business Modules)
	// 注入 global.LOG.Named("module_name") 以区分日志来源
	modules := initModules(qweatherProvider)

	// 4. Router Init
	r := initRouter(modules)

	// 5. Server Start & Graceful Shutdown
	startServer(r)
}

// -------------------------------------------------------------------------
// Internal Helper Functions (Stages)
// -------------------------------------------------------------------------

func initSystem() {
	initialize.InitConfig()
	global.LOG = initialize.InitLogger()
	global.DB = initialize.InitGorm()
	global.REDIS = initialize.InitRedis()
	global.LOG.Info("System initialized")
}

func initInfra() *qweather.Provider {
	client := qweather.NewClient(qweather.Config{
		Key:        global.CONF.QWeather.Key,
		PublicID:   global.CONF.QWeather.PublicID,
		PrivateKey: global.CONF.QWeather.PrivateKey,
		ProjectID:  global.CONF.QWeather.ProjectID,
		Host:       global.CONF.QWeather.Host,
		Timeout:    time.Duration(global.CONF.QWeather.Timeout) * time.Second,
	})
	return qweather.NewProvider(client)
}

type Modules struct {
	User     *user.Module
	City     *city.Module
	Air      *air.Module
	WS       *websocket.Module
	Provider *provider.Module
	Notice   *notice.Module
}

func initModules(qweatherProvider *qweather.Provider) *Modules {
	return &Modules{
		User:     user.NewModule(global.DB),
		City:     city.NewModule(global.DB, qweatherProvider),
		Air:      air.NewModule(global.DB, qweatherProvider),
		WS:       websocket.NewModule(),
		Provider: provider.NewModule(qweatherProvider, global.LOG.Named("provider")),
		Notice:   notice.NewModule(global.DB),
	}
}

func initRouter(m *Modules) *gin.Engine {
	return router.NewRouter(m.User, m.City, m.Air, m.WS, m.Provider, m.Notice)
}

func startServer(r *gin.Engine) {
	host := global.CONF.System.Host
	port := global.CONF.System.Port
	addr := fmt.Sprintf("%s:%d", host, port)

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		// 获取本机首选出站 IP (Network Address)
		ip, err := GetOutboundIP()
		if err != nil {
			ip = "127.0.0.1"
		}

		// 如果 host 配置为空或 0.0.0.0，则说明监听所有接口
		displayHost := host
		if displayHost == "" || displayHost == "0.0.0.0" || displayHost == ":" {
			displayHost = "localhost"
		}

		global.LOG.Info(
			"server started",
			zap.String("local", fmt.Sprintf("http://%s:%d", displayHost, port)),
			zap.String("network", fmt.Sprintf("http://%s:%d", ip, port)),
		)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			global.LOG.Panic("Server start failed", zap.Error(err))
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	global.LOG.Info("Shutdown Server ...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		global.LOG.Fatal("Server Shutdown", zap.Error(err))
	}
	global.LOG.Info("Server exiting")
}

// GetOutboundIP 获取本机首选出站 IP
func GetOutboundIP() (string, error) {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "", err
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	return localAddr.IP.String(), nil
}
