package model

import "go-pratice/internal/module/shared/model"

// City 城市信息表
type City struct {
	model.GVA_MODEL
	CityID  string `gorm:"uniqueIndex;type:varchar(20);not null;comment:和风天气城市ID" json:"cityId"` // 101010100
	Name    string `gorm:"index;type:varchar(50);not null;comment:城市名称" json:"name"`                // 北京
	Lat     string `gorm:"type:varchar(20);comment:纬度" json:"lat"`
	Lon     string `gorm:"type:varchar(20);comment:经度" json:"lon"`
	Adm2    string `gorm:"type:varchar(50);comment:上级行政区" json:"adm2"` // 北京
	Adm1    string `gorm:"type:varchar(50);comment:一级行政区" json:"adm1"` // 北京
	Country string `gorm:"type:varchar(50);comment:国家" json:"country"` // 中国
}
