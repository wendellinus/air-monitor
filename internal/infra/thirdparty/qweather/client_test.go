package qweather

import (
	"context"

	"go-pratice/pkg/global"
	"testing"

	"github.com/spf13/viper"
)

func TestQWeatherRepo_FetchGeo(t *testing.T) {
	// Mock config
	// NOTE: Replace with real key for testing
	// 如果你本地有 config.yaml，也可以尝试加载它，这里简单起见直接 Mock
	// Load config from file
	if global.CONF == nil {
		v := viper.New()
		v.SetConfigFile("e:/wwt-study/projects/go-practice/configs/config.yaml")
		if err := v.ReadInConfig(); err != nil {
			t.Skipf("Config file not found: %v", err)
		}
		if err := v.Unmarshal(&global.CONF); err != nil {
			t.Fatalf("Config unmarshal failed: %v", err)
		}
	}

	if global.CONF.QWeather.Key == "" || global.CONF.QWeather.Key == "YOUR_KEY_HERE" {
		t.Skip("Please set QWeather Key in config to run this test")
	}

	repo := NewQWeatherRepo()
	cities, err := repo.FetchGeo(context.Background(), "Beijing")
	if err != nil {
		t.Fatalf("FetchGeo failed: %v", err)
	}

	if len(cities) == 0 {
		t.Fatal("No cities found")
	}

	t.Logf("Found cities: %+v", cities)
}

func TestQWeatherRepo_FetchAQI(t *testing.T) {
	if global.CONF == nil {
		v := viper.New()
		v.SetConfigFile("e:/wwt-study/projects/go-practice/configs/config.yaml")
		if err := v.ReadInConfig(); err != nil {
			t.Skipf("Config file not found: %v", err)
		}
		if err := v.Unmarshal(&global.CONF); err != nil {
			t.Fatalf("Config unmarshal failed: %v", err)
		}
	}

	if global.CONF.QWeather.Key == "" || global.CONF.QWeather.Key == "YOUR_KEY_HERE" {
		t.Skip("Please set QWeather Key in config to run this test")
	}

	repo := NewQWeatherRepo()
	// Beijing ID: 101010100
	aqi, err := repo.FetchAQI(context.Background(), "101010100")
	if err != nil {
		t.Fatalf("FetchAQI failed: %v", err)
	}

	t.Logf("AQI Data: %+v", aqi)
}
