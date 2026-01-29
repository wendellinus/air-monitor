package qweather

// QWeatherResponse 通用响应包装
type QWeatherResponse struct {
	Code string `json:"code"` // 和风的状态码，如 "200"
}

// API Types
const (
	APITypeGeo              = "Geo"
	APITypeWeather          = "Weather"
	APITypeMinutelyForecast = "MinutelyForecast"
	APITypeWeatherIndices   = "WeatherIndices"
	APITypeWeatherAlert     = "WeatherAlert"
	APITypeAirQuality       = "AirQuality"
	APITypeTimeMachine      = "TimeMachine"
	APITypeStorm            = "Storm"
	APITypeAstronomy        = "Astronomy"
	APITypeSolarIrradiation = "SolarIrradiation"
	APITypeOcean            = "Ocean"
	APITypeConsole          = "Console"
)

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
		Level            *string `json:"level"`
		Category         *string `json:"category"`
		PrimaryPollutant struct {
			Code     *string `json:"code"`
			Name     *string `json:"name"`
			FullName *string `json:"fullName"`
		} `json:"primaryPollutant"`
	} `json:"indexes"`
	Pollutants []struct {
		Code          *string `json:"code"`
		Name          *string `json:"name"`
		FullName      *string `json:"fullName"`
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
	Code             string            `json:"code"`
	Name             string            `json:"name"`
	AQI              float64           `json:"aqi"`
	AQIDisplay       string            `json:"aqiDisplay"`
	Level            *string           `json:"level"`
	Category         *string           `json:"category"`
	Color            Color             `json:"color"`
	PrimaryPollutant *PrimaryPollutant `json:"primaryPollutant"`
	Health           *Health           `json:"health"`
}

// Pollutant 对应 "pollutants" 数组中的每一项 (如 PM2.5, O3)
type Pollutant struct {
	Code          *string       `json:"code"`
	Name          *string       `json:"name"`
	FullName      *string       `json:"fullName"`
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
	Code     *string `json:"code"`
	Name     *string `json:"name"`
	FullName *string `json:"fullName"`
}

type Health struct {
	Effect *string       `json:"effect"`
	Advice *HealthAdvice `json:"advice"`
}

type HealthAdvice struct {
	GeneralPopulation   *string `json:"generalPopulation"`
	SensitivePopulation *string `json:"sensitivePopulation"`
}

type Concentration struct {
	Value float64 `json:"value"`
	Unit  string  `json:"unit"`
}

type SubIndex struct {
	Code       *string  `json:"code"`
	AQI        *float64 `json:"aqi"`
	AQIDisplay string   `json:"aqiDisplay"`
}

type DailyAQIDTO struct {
	Metadata Metadata `json:"metadata"`
	Days     []Days   `json:"days"`
}

type Days struct {
	ForecastStartTime string      `json:"forecastStartTime"`
	ForecastEndTime   string      `json:"forecastEndTime"`
	Indexes           []AQIIndex  `json:"indexes"`
	Pollutants        []Pollutant `json:"pollutants"`
}

type HistoricalDTO struct {
	FxLink    string      `json:"fxLink"`
	AirHourly []AirHourly `json:"airHourly"`
	Refer     []Refer     `json:"refer"`
}

type AirHourly struct {
	PubTime  string  `json:"pubTime"`
	Aqi      string  `json:"aqi"`
	Level    string  `json:"level"`
	Category string  `json:"category"`
	Primary  string  `json:"primary"`
	Pm10     float32 `json:"pm10"`
	Pm2p5    float32 `json:"pm2p5"`
	No2      float32 `json:"no2"`
	So2      float32 `json:"so2"`
	Co       float32 `json:"co"`
	O3       float32 `json:"o3"`
}

type Refer struct {
	Sources string `json:"sources"`
	License string `json:"license"`
}

type StatsDTO struct {
	Metadata Metadata `json:"metadata"`
	AsOf     string   `json:"asOf"`
	Success  []Result `json:"success"`
	Errors   []Result `json:"errors"`
}

type Result struct {
	Api   string `json:"api"`
	Hours []int  `json:"hours"`
}

type SummaryDTO struct {
	Metadata               Metadata                 `json:"metadata"`
	AsOf                   string                   `json:"asOf"`
	Currency               string                   `json:"currency"`
	Balance                float32                  `json:"balance"`
	AccruedCharges         AccruedCharges           `json:"accruedCharges"`
	PendingBills           []PendingBills           `json:"pendingBills"`
	AvailableSavingsPlans  []AvailableSavingsPlans  `json:"availableSavingsPlans"`
	AvailableResourcePlans []AvailableResourcePlans `json:"availableResourcePlans"`
}

type AccruedCharges struct {
	PreviousDay   float32 `json:"previousDay"`
	ThisMonth     float32 `json:"thisMonth"`
	SinceLastBill float64 `json:"sinceLastBill"`
}

type PendingBills struct {
	Number    string  `json:"number"`
	Date      string  `json:"date"`
	Type      string  `json:"type"`
	Status    string  `json:"status"`
	Amount    float32 `json:"amount"`
	AmountDue float32 `json:"amountDue"`
	DueDate   string  `json:"dueDate"`
}

type AvailableSavingsPlans struct {
	BillNumber    string  `json:"billNumber"`
	Status        string  `json:"status"`
	Term          string  `json:"term"`
	Commitments   float64 `json:"commitments"`
	Utilized      float64 `json:"utilized"`
	EffectiveTime string  `json:"effectiveTime"`
}

type AvailableResourcePlans struct {
	BillNumber    string `json:"billNumber"`
	Status        string `json:"status"`
	Requests      int    `json:"requests"`
	Utilized      int    `json:"utilized"`
	EffectiveTime string `json:"effectiveTime"`
}

type WeatherAlert struct {
	Metadata AlertMetadata `json:"metadata"`
	Alerts   []Alert       `json:"alerts"`
}

type AlertMetadata struct {
	Tag          string   `json:"tag"`
	ZeroResult   bool     `json:"zeroResult"`
	Attributions []string `json:"attributions"`
}

type Alert struct {
	Id            string           `json:"id"`
	SenderName    *string          `json:"senderName"`
	IssuedTime    string           `json:"issuedTime"`
	MessageType   AlertMessageType `json:"messageType"`
	EventType     AlertEventType   `json:"eventType"`
	Urgency       *string          `json:"urgency"`
	Severity      *string          `json:"severity"`
	Certainty     *string          `json:"certainty"`
	Icon          string           `json:"icon"`
	Color         AlertColor       `json:"color"`
	EffectiveTime *string          `json:"effectiveTime"`
	OnsetTime     *string          `json:"onsetTime"`
	ExpireTime    *string          `json:"expireTime"`
	Headline      string           `json:"headline"`
	Description   string           `json:"description"`
	Criteria      *string          `json:"criteria"`
	Instruction   *string          `json:"instruction"`
	ResponseTypes []string         `json:"responseTypes"`
}

// AlertMessageType 预警信息性质
type AlertMessageType struct {
	Code       string   `json:"code"`       // alert, update, cancel
	Supersedes []string `json:"supersedes"` // 被取代的预警ID列表
}

// AlertEventType 预警事件类型
type AlertEventType struct {
	Name string `json:"name"` // 事件名称，如"大风"
	Code string `json:"code"` // 事件代码，如"1006"
}

// AlertColor 预警颜色（RGBA）
type AlertColor struct {
	Code  string  `json:"code"`  // 颜色代码，如 blue, yellow, orange, red
	Red   int     `json:"red"`   // 0-255
	Green int     `json:"green"` // 0-255
	Blue  int     `json:"blue"`  // 0-255
	Alpha float64 `json:"alpha"` // 0-1
}
