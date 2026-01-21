package qweather

// QWeatherResponse 通用响应包装
type QWeatherResponse struct {
	Code string `json:"code"` // 和风的状态码，如 "200"
}

type CityDTO struct {
	Name      string `json:"name"`
	ID        string `json:"id"`
	Lat       string `json:"lat"`
	Lon       string `json:"lon"`
	Adm1      string `json:"adm1"` // 一级行政区
	Adm2      string `json:"adm2"` // 二级行政区
	Country   string `json:"country"`
	Tz        string `json:"tz"`
	UtcOffset string `json:"utcOffset"`
	IsDst     string `json:"isDst"`
	Type      string `json:"type"`
	Rank      string `json:"rank"`
	FxLink    string `json:"fxLink"`
}

// GeoDTO 城市搜索接口的原始响应
type GeoDTO struct {
	QWeatherResponse
	Location []CityDTO `json:"location"`
}

type TopCityDTO struct {
	QWeatherResponse
	TopCityList []CityDTO `json:"topCityList"`
}

// AQIDTO 实时空气质量原始响应
type AQIDTO struct {
	Metadata struct {
		Tag string `json:"tag"`
	} `json:"metadata"`
	Indexes []struct {
		Code             string  `json:"code"`
		Name             string  `json:"name"`
		Aqi              float64 `json:"aqi"`
		AqiDisplay       string  `json:"aqiDisplay"`
		Level            string  `json:"level"`
		Category         string  `json:"category"`
		PrimaryPollutant struct {
			Code     string `json:"code"`
			Name     string `json:"name"`
			FullName string `json:"fullName"`
		} `json:"primaryPollutant"`
	} `json:"indexes"`
	Pollutants []struct {
		Code          string `json:"code"`
		Name          string `json:"name"`
		FullName      string `json:"fullName"`
		Concentration struct {
			Value float64 `json:"value"`
			Unit  string  `json:"unit"`
		} `json:"concentration"`
	} `json:"pollutants"`
}

type HourlyAQIDTO struct {
	Metadata Metadata     `json:"metadata"`
	Hours    []HourlyItem `json:"hours"`
}

type Metadata struct {
	Tag string `json:"tag"`
}

type HourlyItem struct {
	ForecastTime string      `json:"forecastTime"`
	Indexes      []AQIIndex  `json:"indexes"`
	Pollutants   []Pollutant `json:"pollutants"`
}

// AQIIndex 对应 "indexes" 数组中的每一项 (如 QAQI, GB-DEFRA)
type AQIIndex struct {
	Code             string           `json:"code"`
	Name             string           `json:"name"`
	AQI              float64          `json:"aqi"`
	AQIDisplay       string           `json:"aqiDisplay"`
	Level            string           `json:"level"`
	Category         string           `json:"category"`
	Color            Color            `json:"color"`
	PrimaryPollutant PrimaryPollutant `json:"primaryPollutant"`
	Health           Health           `json:"health"`
}

// Pollutant 对应 "pollutants" 数组中的每一项 (如 PM2.5, O3)
type Pollutant struct {
	Code          string        `json:"code"`
	Name          string        `json:"name"`
	FullName      string        `json:"fullName"`
	Concentration Concentration `json:"concentration"`
	SubIndexes    []SubIndex    `json:"subIndexes"`
}

// 辅助结构体
type Color struct {
	Red   int `json:"red"`
	Green int `json:"green"`
	Blue  int `json:"blue"`
	Alpha int `json:"alpha"`
}

type PrimaryPollutant struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	FullName string `json:"fullName"`
}

type Health struct {
	Effect string       `json:"effect"`
	Advice HealthAdvice `json:"advice"`
}

type HealthAdvice struct {
	GeneralPopulation   string `json:"generalPopulation"`
	SensitivePopulation string `json:"sensitivePopulation"`
}

type Concentration struct {
	Value float64 `json:"value"`
	Unit  string  `json:"unit"`
}

type SubIndex struct {
	Code       string  `json:"code"`
	AQI        float64 `json:"aqi"`
	AQIDisplay string  `json:"aqiDisplay"`
}
