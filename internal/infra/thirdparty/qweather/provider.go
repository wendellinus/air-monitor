package qweather

import (
	"context"
	"fmt"
	"time"

	airModel "go-pratice/internal/module/air/model"
	airService "go-pratice/internal/module/air/service"
	cityModel "go-pratice/internal/module/city/model"
	cityService "go-pratice/internal/module/city/service"
)

// Provider 适配器，实现业务层接口
type Provider struct {
	client *Client
}

// Ensure implementation
var _ airService.IAirProvider = (*Provider)(nil)
var _ cityService.IGeoProvider = (*Provider)(nil)

func NewProvider(client *Client) *Provider {
	return &Provider{
		client: client,
	}
}

// FetchGeo 实现 IGeoProvider 接口
func (p *Provider) FetchGeo(ctx context.Context, keyword string) ([]cityModel.City, error) {
	dto, err := p.client.GetGeo(ctx, keyword)
	if err != nil {
		return nil, err
	}

	var cities []cityModel.City
	for _, item := range dto.Location {
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

func (p *Provider) GetTopCities(ctx context.Context, rangeType string, number int) ([]cityModel.City, error) {
	dto, err := p.client.GetTopCities(ctx, rangeType, number)
	if err != nil {
		return nil, err
	}

	var cities []cityModel.City
	for _, item := range dto.TopCityList {
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

// FetchAQI 实现 IAirProvider 接口
func (p *Provider) FetchAQI(ctx context.Context, lat, lon string) (*airModel.AirQualityLog, error) {
	dto, err := p.client.GetAQI(ctx, lat, lon)
	if err != nil {
		return nil, err
	}

	// 解析数据
	var aqi int
	var level, category, primary string
	var pm10, pm2p5, no2, so2, co, o3 float64

	if len(dto.Indexes) > 0 {
		idx := dto.Indexes[0]
		aqi = int(idx.Aqi)
		level = idx.Level
		category = idx.Category
		primary = idx.PrimaryPollutant.Name
	}

	for _, pol := range dto.Pollutants {
		val := pol.Concentration.Value
		switch pol.Code {
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

func (p *Provider) FetchHourlyAQI(ctx context.Context, lat, lon string) ([]*airModel.AirQualityLog, error) {
	// 拿到和风提供的数据
	dto, err := p.client.GetHourlyAQI(ctx, lat, lon)
	if err != nil {
		return nil, err
	}

	// 将和风中获取的数据（json）转换成自己的业务Model
	// 使用 AirQualityLog 结构，因为它包含了所有需要的字段（污染物详情等），比 HourlyItem 更完整
	var logs []*airModel.AirQualityLog

	for _, item := range dto.Hours {
		// 解析时间
		pubTime, err := ParseISOTime(item.ForecastTime)
		if err != nil {
			// 如果时间解析失败，记录日志或跳过，这里选择跳过或使用当前时间，或者直接返回错误
			// 为了健壮性，这里仅记录错误并继续，或者返回错误。鉴于这是数据转换，返回错误较好
			return nil, err
		}

		log := &airModel.AirQualityLog{
			PubTime: pubTime,
		}

		// 填充 AQI 基本信息
		if len(item.Indexes) > 0 {
			idx := item.Indexes[0]
			log.AQI = int(idx.AQI)
			log.Level = idx.Level
			log.Category = idx.Category
			log.Primary = idx.PrimaryPollutant.Name
		}

		// 填充污染物数据
		for _, pol := range item.Pollutants {
			val := pol.Concentration.Value
			switch pol.Code {
			case "pm10":
				log.PM10 = val
			case "pm2p5":
				log.PM2p5 = val
			case "no2":
				log.NO2 = val
			case "so2":
				log.SO2 = val
			case "co":
				log.CO = val
			case "o3":
				log.O3 = val
			}
		}

		logs = append(logs, log)
	}

	return logs, nil
}

func ParseISOTime(str string) (time.Time, error) {
	layouts := []string{
		time.RFC3339,                    // 2006-01-02T15:04:05Z07:00
		"2006-01-02T15:04Z07:00",        // 没有秒的 ISO8601
		"2006-01-02T15:04:05.000Z07:00", // 带毫秒
		"2006-01-02T15:04:05Z07:00",     // 有秒但带Z
	}

	var t time.Time
	var err error
	for _, layout := range layouts {
		t, err = time.Parse(layout, str)
		if err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("无法解析时间: %s", str)
}
