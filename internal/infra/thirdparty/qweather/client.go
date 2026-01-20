package qweather

import (
	"compress/gzip"
	"context"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	airModel "go-pratice/internal/module/air/model"
	cityModel "go-pratice/internal/module/city/model"
	"go-pratice/pkg/global"
)

type QWeatherRepo struct {
	client     *http.Client
	key        string
	publicID   string
	projectID  string
	privateKey string
}

func NewQWeatherRepo() *QWeatherRepo {
	return &QWeatherRepo{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		key:        global.CONF.QWeather.Key,
		publicID:   global.CONF.QWeather.PublicID,
		projectID:  global.CONF.QWeather.ProjectID,
		privateKey: global.CONF.QWeather.PrivateKey,
	}
}

// getAuthToken 生成认证 Token (优先使用 JWT)
func (r *QWeatherRepo) getAuthToken() (string, error) {
	// 1. 如果配置了 JWT，优先生成 JWT
	if r.publicID != "" && r.privateKey != "" {
		block, _ := pem.Decode([]byte(r.privateKey))
		if block == nil {
			return "", fmt.Errorf("failed to parse private key PEM")
		}

		// 解析 Ed25519 私钥 (PKCS#8 格式)
		privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return "", fmt.Errorf("failed to parse private key: %w", err)
		}

		now := time.Now()
		claims := jwt.MapClaims{
			"sub": r.projectID,
			"iss": r.publicID,
			"iat": now.Unix(),
			"exp": now.Add(5 * time.Minute).Unix(), // 5分钟有效期
		}

		token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
		token.Header["kid"] = r.publicID // 关键：kid 必须在 Header 中
		signedToken, err := token.SignedString(privKey)
		if err != nil {
			return "", fmt.Errorf("failed to sign token: %w", err)
		}
		return "Bearer " + signedToken, nil
	}

	// 2. 降级使用 API Key
	if r.key != "" {
		return r.key, nil // 注意：API Key 方式在 Header 中不需要 Bearer 前缀，而是直接作为 Value，或者 X-QW-Api-Key
	}

	return "", fmt.Errorf("no valid credentials found (JWT or API Key)")
}

// doRequest 发送请求并处理 Gzip 解压
func (r *QWeatherRepo) doRequest(req *http.Request) ([]byte, error) {
	// 模拟浏览器行为，避免被拦截
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var reader io.ReadCloser
	switch resp.Header.Get("Content-Encoding") {
	case "gzip":
		reader, err = gzip.NewReader(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("gzip decode failed: %w", err)
		}
		defer reader.Close()
	default:
		reader = resp.Body
	}

	body, err := io.ReadAll(reader)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("qweather api failed: %d, body: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// FetchGeo 获取城市 Geo 信息
func (r *QWeatherRepo) FetchGeo(ctx context.Context, keyword string) ([]cityModel.City, error) {
	// 使用配置文件中的 Host
	host := global.CONF.QWeather.Host
	if host == "" {
		host = "https://geoapi.qweather.com" // 默认值
	}
	url := fmt.Sprintf("%s/geo/v2/city/lookup?location=%s", host, keyword)
	fmt.Println("DEBUG URL:", url)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	// 设置认证 Header
	token, err := r.getAuthToken()
	if err != nil {
		return nil, err
	}
	
	// 判断是 JWT 还是 API Key
	if len(token) > 7 && token[:7] == "Bearer " {
		req.Header.Set("Authorization", token)
	} else {
		req.Header.Set("X-QW-Api-Key", token)
	}

	body, err := r.doRequest(req)
	if err != nil {
		return nil, err
	}

	var result QWeatherGeoResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("unmarshal failed: %w, body: %s", err, string(body))
	}

	if result.Code != "200" {
		return nil, fmt.Errorf("qweather api error code: %s, body: %s", result.Code, string(body))
	}

	var cities []cityModel.City
	for _, item := range result.Location {
		cities = append(cities, cityModel.City{
			CityID:  item.ID,
			Name:    item.Name,
			Lat:     item.Lat,
			Lon:     item.Lon,
			Adm2:    item.Adm2,
			Adm1:    item.Adm1,
			Country: item.Country,
		})
	}
	return cities, nil
}

// FetchAQI 获取实时空气质量
func (r *QWeatherRepo) FetchAQI(ctx context.Context, lat, lon string) (*airModel.AirQualityLog, error) {
	// 使用配置文件中的 Host
	host := global.CONF.QWeather.Host
	if host == "" {
		host = "https://devapi.qweather.com" // 默认值
	}
	// 新版 API 路径: /airquality/v1/current/{latitude}/{longitude}
	url := fmt.Sprintf("%s/airquality/v1/current/%s/%s", host, lat, lon)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	// 设置认证 Header
	token, err := r.getAuthToken()
	if err != nil {
		return nil, err
	}

	if len(token) > 7 && token[:7] == "Bearer " {
		req.Header.Set("Authorization", token)
	} else {
		req.Header.Set("X-QW-Api-Key", token)
	}

	body, err := r.doRequest(req)
	if err != nil {
		return nil, err
	}

	var result QWeatherAQIResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("unmarshal failed: %w, body: %s", err, string(body))
	}

	// 解析数据
	var aqi int
	var level, category, primary string
	var pm10, pm2p5, no2, so2, co, o3 float64

	// 优先使用 local AQI (通常是第一个，或者根据 code 判断)
	// 这里简单取第一个 index
	if len(result.Indexes) > 0 {
		idx := result.Indexes[0]
		aqi = int(idx.Aqi)
		level = idx.Level
		category = idx.Category
		primary = idx.PrimaryPollutant.Name
	}

	for _, p := range result.Pollutants {
		val := p.Concentration.Value
		switch p.Code {
		case "pm10":
			pm10 = val
		case "pm2p5":
			pm2p5 = val
		case "no2":
			no2 = val
		case "so2":
			so2 = val
		case "co":
			co = val
		case "o3":
			o3 = val
		}
	}

	return &airModel.AirQualityLog{
		// CityID:   cityID, // 这里的 CityID 需要在上层填充
		PubTime:  time.Now(), // API 返回中没有明确的时间，使用当前时间
		AQI:      aqi,
		Level:    level,
		Category: category,
		Primary:  primary,
		PM10:     pm10,
		PM2p5:    pm2p5,
		NO2:      no2,
		SO2:      so2,
		CO:       co,
		O3:       o3,
	}, nil
}
