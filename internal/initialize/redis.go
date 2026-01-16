package initialize

import (
	"context"
	"fmt"
	"go-pratice/pkg/global"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func InitRedis() *redis.Client {
	redisCfg := global.CONF.Redis

	// 1. 创建客户端
	client := redis.NewClient(&redis.Options{
		Addr:     redisCfg.Addr,
		Password: redisCfg.Password,
		DB:       redisCfg.DB,
	})

	// 2. 测试连接 (Ping)
	// context.Background() 是 Go 里的上下文对象，通常用于控制超时
	pong, err := client.Ping(context.Background()).Result()
	if err != nil {
		global.LOG.Error("Redis 连接失败", zap.Error(err))
		panic(fmt.Errorf("Redis 连接失败: %s", err))
	}

	global.LOG.Info("Redis 连接成功", zap.String("pong", pong))
	return client
}
