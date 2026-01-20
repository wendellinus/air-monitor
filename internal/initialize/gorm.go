package initialize

import (
	"fmt"
	"go-pratice/pkg/global"
	"time"

	airModel "go-pratice/internal/module/air/model"
	cityModel "go-pratice/internal/module/city/model"
	userModel "go-pratice/internal/module/user/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitGorm() *gorm.DB {
	p := global.CONF.Pgsql

	// 拼接 DSN
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s %s",
		p.Path, p.Username, p.Password, p.Dbname, p.Port, p.Config)

	// 配置 Gorm 的日志策略
	// 开发模式下，希望能在控制台看见所有执行的 SQL 的语句
	var gormLogger logger.Interface
	if p.LogMode == "info" {
		gormLogger = logger.Default.LogMode(logger.Info)
	} else {
		gormLogger = logger.Default.LogMode(logger.Error)
	}

	// 打开连接
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		// 这里直接 Panic，因为连不上数据库服务也起不来
		panic(fmt.Errorf("连接数据库失败: %s", err))
	}

	// 配置连接池
	// 获取通用的数据库对象 sql.DB，以此来设置连接池参数
	sqlDB, _ := db.DB()

	// SetMaxIdleConns 设置空闲连接池中连接的最大数量
	sqlDB.SetMaxIdleConns(p.MaxIdleConns)

	// SetMaxOpenConns 设置打开数据库连接的最大数量
	sqlDB.SetMaxOpenConns(p.MaxOpenConns)

	// SetConnMaxLifetime 设置了连接可复用的最大时间
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 自动迁移 (Auto Migrate)
	// 这一步非常关键：GORM 会根据 struct 自动创建或更新数据库表结构
	// 如果表不存在，它会创建；如果字段增加了，它会修改表结构
	if err := db.AutoMigrate(
		&cityModel.City{},
		&airModel.AirQualityLog{},
		&userModel.User{},
	); err != nil {
		panic(fmt.Errorf("数据库迁移失败: %s", err))
	}

	return db
}
