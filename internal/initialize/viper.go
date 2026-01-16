package initialize

import (
	"fmt"
	"go-pratice/pkg/global"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
)

func InitConfig() *viper.Viper {
	v := viper.New()
	v.SetConfigFile("configs/config.yaml")

	if err := v.ReadInConfig(); err != nil {
		panic(fmt.Errorf("读取配置文件失败: %s", err))
	}

	v.WatchConfig()
	v.OnConfigChange(func(e fsnotify.Event) {
		fmt.Println("配置文件被修改：", e.Name)
		// 重新映射到 global.CONF
		if err := v.Unmarshal(&global.CONF); err != nil {
			fmt.Println("配置文件重载失败:", err)
		}
	})

	if err := v.Unmarshal(&global.CONF); err != nil {
		panic(fmt.Errorf("解析配置文件失败：%s", err))
	}

	return v
}
