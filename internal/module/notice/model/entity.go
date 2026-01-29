package model

import (
	"time"

	"gorm.io/gorm"
)

const (
	StatusDraft     = "draft"     // 草稿
	StatusPublished = "published" // 已发布
	StatusRevoked   = "revoked"   // 已撤回

	LevelInfo   = "info"   // 普通通知（蓝色/白色）
	LevelUrgent = "urgent" // 紧急通知（红色）

	SourceManual   = "manual"   // 手动创建
	SourceQWeather = "qweather" // 和风天气预警
)

type Notice struct {
	gorm.Model
	Title     string    `json:"title" gorm:"type:varchar(200);not null"`
	Content   string    `json:"content" gorm:"type:text"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	Status    string    `json:"status" gorm:"default:'draft'"`
	Level     string    `json:"level" gorm:"default:'info'"`

	// 预警专属字段（可空，仅 Source=qweather 时有值）
	AlertID   *string `json:"alertId" gorm:"type:varchar(50);uniqueIndex"` // 和风预警唯一ID，用于去重
	EventType *string `json:"eventType" gorm:"type:varchar(50)"`           // 事件类型，如"大风"
	Severity  *string `json:"severity" gorm:"type:varchar(20)"`            // 严重程度，如 minor/moderate/severe
	ColorCode *string `json:"colorCode" gorm:"type:varchar(20)"`           // 颜色代码，如 blue/yellow/red
	Source    string  `json:"source" gorm:"type:varchar(20);default:'manual'"`
}
