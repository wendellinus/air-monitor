package model

import (
	"go-pratice/internal/module/shared/model"
	"time"
)

// AirQualityLog 空气质量历史记录表 (用于实时数据存储)
type AirQualityLog struct {
	model.GVA_MODEL
	CityID   string    `gorm:"index;type:varchar(20);not null;comment:城市ID" json:"cityId"`
	PubTime  time.Time `gorm:"index;comment:发布时间" json:"pubTime"`
	AQI      int       `gorm:"type:int;comment:空气质量指数" json:"aqi"`
	Level    string    `gorm:"type:varchar(10);comment:等级" json:"level"`    // 1
	Category string    `gorm:"type:varchar(20);comment:类别" json:"category"` // 优
	Primary  string    `gorm:"type:varchar(50);comment:首要污染物" json:"primary"`
	PM10     float64   `gorm:"type:decimal(10,2);comment:PM10" json:"pm10"`
	PM2p5    float64   `gorm:"type:decimal(10,2);comment:PM2.5" json:"pm2p5"`
	NO2      float64   `gorm:"type:decimal(10,2);comment:二氧化氮" json:"no2"`
	SO2      float64   `gorm:"type:decimal(10,2);comment:二氧化硫" json:"so2"`
	CO       float64   `gorm:"type:decimal(10,2);comment:一氧化碳" json:"co"`
	O3       float64   `gorm:"type:decimal(10,2);comment:臭氧" json:"o3"`
}

// HourlyAQI 小时级空气质量预报 (不入库，仅用于 API 返回)
type HourlyAQI struct {
	CityID       string    `json:"cityId"`
	ForecastTime time.Time `json:"forecastTime"`
	AQI          int       `json:"aqi"`
	Level        string    `json:"level"`
	Category     string    `json:"category"`
	Primary      string    `json:"primary"`
	PM10         float64   `json:"pm10"`
	PM2p5        float64   `json:"pm2p5"`
	NO2          float64   `json:"no2"`
	SO2          float64   `json:"so2"`
	CO           float64   `json:"co"`
	O3           float64   `json:"o3"`
}

// DailyAQI 天级空气质量预报 (不入库，仅用于 API 返回)
type DailyAQI struct {
	CityID            string    `json:"cityId"`
	ForecastDate      string    `json:"forecastDate"` // YYYY-MM-DD
	ForecastStartTime time.Time `json:"forecastStartTime"`
	ForecastEndTime   time.Time `json:"forecastEndTime"`
	AQI               int       `json:"aqi"`
	Level             string    `json:"level"`
	Category          string    `json:"category"`
	Primary           string    `json:"primary"`
	PM10              float64   `json:"pm10"`
	PM2p5             float64   `json:"pm2p5"`
	NO2               float64   `json:"no2"`
	SO2               float64   `json:"so2"`
	CO                float64   `json:"co"`
	O3                float64   `json:"o3"`
}
