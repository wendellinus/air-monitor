package bootstrap

import (
	"context"
	"fmt"
	"go-pratice/internal/infra/thirdparty/qweather"
	"go-pratice/internal/initialize"
	"go-pratice/internal/module/air"
	"go-pratice/internal/module/city"
	"go-pratice/internal/module/user"
	"go-pratice/internal/module/websocket"
	"go-pratice/internal/router"
	"go-pratice/pkg/global"
	"net/http"
	"os"
	"os/signal"
	"time"
)

// Run 启动应用
func Run() {
	// 1. 初始化配置
	initialize.InitConfig()

	// 2. 初始化日志
	global.LOG = initialize.InitLogger()

	// 3. 初始化数据库
	global.DB = initialize.InitGorm()

	// 4. 初始化 Redis
	global.REDIS = initialize.InitRedis()

	// 5. 初始化基础设施 (Infra)
	qweatherRepo := qweather.NewQWeatherRepo()

	// 6. 初始化业务模块 (Modules)
	userMod := user.NewModule(global.DB)
	cityMod := city.NewModule(global.DB, qweatherRepo)
	airMod := air.NewModule(global.DB, qweatherRepo)
	wsMod := websocket.NewModule()

	// 7. 初始化路由 (Router)
	r := router.NewRouter(userMod, cityMod, airMod, wsMod)

	// 8. 启动服务 (优雅关闭)
	addr := fmt.Sprintf(":%d", global.CONF.System.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		global.LOG.Info(fmt.Sprintf("Server starting on %s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			global.LOG.Panic(fmt.Sprintf("Server start failed: %s", err))
		}
	}()

	// 等待中断信号以优雅地关闭服务器（设置 5 秒的超时时间）
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	global.LOG.Info("Shutdown Server ...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		global.LOG.Fatal(fmt.Sprintf("Server Shutdown: %s", err))
	}
	global.LOG.Info("Server exiting")
}
