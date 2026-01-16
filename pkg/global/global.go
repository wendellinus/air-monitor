package global

import (
	"go-pratice/internal/config"

	"github.com/redis/go-redis/v9"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// 全局变量，类似于 React 的 Context 或 Redux Store
// 这里的变量首字母大写，表示可以被其他包访问
var (
	CONF  *config.Server // 指针类型，指向配置对象
	VP    *viper.Viper   // Viper 实例
	LOG   *zap.Logger    // Zap 日志实例
	DB    *gorm.DB       // 数据库对象
	REDIS *redis.Client  // 全局 Redis 客户端
)
