package logger

import (
	"go.uber.org/zap"
)

var Logger *zap.Logger

func Init(env string) error {
	var err error

	if env == "dev" {
		Logger, err = zap.NewDevelopment()
	} else {
		Logger, err = zap.NewProduction()
	}

	if err != nil {
		return err
	}

	return nil
}
