package qweather

// QWeatherGeoResponse 和风天气 Geo API 响应
type QWeatherGeoResponse struct {
	Code     string         `json:"code"`
	Location []QWeatherCity `json:"location"`
}

type QWeatherCity struct {
	Name      string `json:"name"`
	ID        string `json:"id"`
	Lat       string `json:"lat"`
	Lon       string `json:"lon"`
	Adm2      string `json:"adm2"`
	Adm1      string `json:"adm1"`
	Country   string `json:"country"`
	Tz        string `json:"tz"`
	UtcOffset string `json:"utcOffset"`
	IsDst     string `json:"isDst"`
	Type      string `json:"type"`
	Rank      string `json:"rank"`
	FxLink    string `json:"fxLink"`
}

// QWeatherAQIResponse 和风天气 AQI API 响应 (新版)
type QWeatherAQIResponse struct {
	Metadata   struct {
		Tag string `json:"tag"`
	} `json:"metadata"`
	Indexes []struct {
		Code             string `json:"code"`
		Name             string `json:"name"`
		Aqi              float64 `json:"aqi"`
		AqiDisplay       string `json:"aqiDisplay"`
		Level            string `json:"level"`
		Category         string `json:"category"`
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
