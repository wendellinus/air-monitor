package bootstrap

import (
	"context"
	"fmt"
	"go-pratice/internal/infra/cache"
	"go-pratice/internal/infra/thirdparty/qweather"
	"go-pratice/internal/initialize"
	"go-pratice/internal/module/air"
	"go-pratice/internal/module/city"
	"go-pratice/internal/module/notice"
	"go-pratice/internal/module/provider"
	"go-pratice/internal/module/user"
	"go-pratice/internal/module/websocket"
	"go-pratice/internal/router"
	"go-pratice/internal/scheduler"
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

	// 2. Infra Init (Third-party Clients with Cache)
	qweatherProvider := initInfra()

	// 3. Module Assemble (Business Modules)
	modules := initModules(qweatherProvider)

	// 4. Router Init
	r := initRouter(modules)

	// 5. Cache Warmup (异步预热，不阻塞启动)
	go warmupCache(qweatherProvider)

	// 6. Start Scheduler (定时任务，配置化)
	sched := scheduler.New(qweatherProvider, global.CONF.Cron.CacheRefresh, global.LOG.Named("scheduler"))
	sched.Start()

	// 7. Server Start & Graceful Shutdown
	startServer(r, sched)
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

func initInfra() *qweather.CachedProvider {
	// 1. 创建原始 QWeather Client 和 Provider
	client := qweather.NewClient(qweather.Config{
		Key:        global.CONF.QWeather.Key,
		PublicID:   global.CONF.QWeather.PublicID,
		PrivateKey: global.CONF.QWeather.PrivateKey,
		ProjectID:  global.CONF.QWeather.ProjectID,
		Host:       global.CONF.QWeather.Host,
		Timeout:    time.Duration(global.CONF.QWeather.Timeout) * time.Second,
	})
	rawProvider := qweather.NewProvider(client)

	// 2. 创建缓存层
	redisCache := cache.NewRedisCache(global.REDIS)

	// 3. 解析 TTL 配置 (使用配置值，失败时使用默认值)
	cacheConfig := qweather.CacheConfig{
		AirRealtimeTTL:  parseDuration(global.CONF.Cache.AirRealtimeTTL, 45*time.Minute),
		AirHourlyTTL:    parseDuration(global.CONF.Cache.AirHourlyTTL, 45*time.Minute),
		AirDailyTTL:     parseDuration(global.CONF.Cache.AirDailyTTL, 10*time.Hour),
		WeatherAlertTTL: parseDuration(global.CONF.Cache.WeatherAlertTTL, 10*time.Minute),
		TopCitiesTTL:    parseDuration(global.CONF.Cache.TopCitiesTTL, 1*time.Hour),
	}

	global.LOG.Info("Cache config loaded",
		zap.Duration("air_realtime_ttl", cacheConfig.AirRealtimeTTL),
		zap.Duration("air_hourly_ttl", cacheConfig.AirHourlyTTL),
		zap.Duration("air_daily_ttl", cacheConfig.AirDailyTTL),
		zap.Duration("weather_alert_ttl", cacheConfig.WeatherAlertTTL),
		zap.Duration("top_cities_ttl", cacheConfig.TopCitiesTTL),
	)

	// 4. 返回带缓存的 Provider (装饰器)
	return qweather.NewCachedProvider(rawProvider, redisCache, cacheConfig, global.LOG.Named("cache"))
}

// parseDuration 解析时间字符串，失败时返回默认值
func parseDuration(s string, defaultVal time.Duration) time.Duration {
	if s == "" {
		return defaultVal
	}
	if d, err := time.ParseDuration(s); err == nil {
		return d
	}
	return defaultVal
}

type Modules struct {
	User     *user.Module
	City     *city.Module
	Air      *air.Module
	WS       *websocket.Module
	Provider *provider.Module
	Notice   *notice.Module
}

func initModules(qweatherProvider *qweather.CachedProvider) *Modules {
	return &Modules{
		User:     user.NewModule(global.DB),
		City:     city.NewModule(global.DB, qweatherProvider),
		Air:      air.NewModule(global.DB, qweatherProvider),
		WS:       websocket.NewModule(),
		Provider: provider.NewModule(qweatherProvider, global.LOG.Named("provider")),
		Notice:   notice.NewModule(global.DB, qweatherProvider, global.LOG.Named("notice")),
	}
}

func initRouter(m *Modules) *gin.Engine {
	return router.NewRouter(m.User, m.City, m.Air, m.WS, m.Provider, m.Notice)
}

// warmupCache 启动时预热缓存（异步执行，失败只记日志）
func warmupCache(provider *qweather.CachedProvider) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	global.LOG.Info("开始缓存预热...")

	// 预热中国热门城市 Top 20
	if _, err := provider.GetTopCities(ctx, "cn", 20); err != nil {
		global.LOG.Warn("预热中国热门城市失败", zap.Error(err))
	} else {
		global.LOG.Info("预热中国热门城市成功", zap.Int("count", 20))
	}

	// 预热世界热门城市 Top 10
	if _, err := provider.GetTopCities(ctx, "world", 10); err != nil {
		global.LOG.Warn("预热世界热门城市失败", zap.Error(err))
	} else {
		global.LOG.Info("预热世界热门城市成功", zap.Int("count", 10))
	}

	global.LOG.Info("缓存预热完成")
}

func startServer(r *gin.Engine, sched *scheduler.Scheduler) {
	host := global.CONF.System.Host
	port := global.CONF.System.Port
	addr := fmt.Sprintf("%s:%d", host, port)

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		ip, err := GetOutboundIP()
		if err != nil {
			ip = "127.0.0.1"
		}

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

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	global.LOG.Info("Shutdown Server ...")

	// 停止定时任务
	sched.Stop()

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
