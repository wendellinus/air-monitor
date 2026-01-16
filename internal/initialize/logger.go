package initialize

import (
	"go-pratice/pkg/global"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

func InitLogger() *zap.Logger {
	// 获取日志配置
	cfg := global.CONF.Log

	// 确认日志级别
	var level zapcore.Level
	switch cfg.Level {
	case "debug":
		level = zapcore.DebugLevel
	case "info":
		level = zapcore.InfoLevel
	case "error":
		level = zapcore.ErrorLevel
	default:
		level = zapcore.InfoLevel
	}

	// 定义日志切割
	fileWriter := &lumberjack.Logger{
		Filename:   cfg.RootDir + "/" + cfg.Filename,
		MaxSize:    cfg.MaxSize,    // MB
		MaxBackups: cfg.MaxBackups, // 个数
		MaxAge:     cfg.MaxAge,     // 天
		Compress:   true,           // 压缩
	}

	// 1. 配置控制台 Encoder (带颜色)
	consoleEncoderConfig := zap.NewProductionEncoderConfig()
	consoleEncoderConfig.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		enc.AppendString(t.Format(time.DateTime))
	}
	consoleEncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(consoleEncoderConfig),
		zapcore.AddSync(os.Stdout),
		level,
	)

	// 2. 配置文件 Encoder (无颜色，纯文本)
	fileEncoderConfig := zap.NewProductionEncoderConfig()
	fileEncoderConfig.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		enc.AppendString(t.Format(time.DateTime))
	}
	fileEncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder // 无颜色
	fileCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(fileEncoderConfig), // 或者用 NewJSONEncoder
		zapcore.AddSync(fileWriter),
		level,
	)

	// 3. 合并 Core
	core := zapcore.NewTee(consoleCore, fileCore)

	// 构造 Logger
	logger := zap.New(core, zap.AddCaller())

	return logger
}
