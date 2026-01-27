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
)

type Notice struct {
	gorm.Model
	Title     string    `json:"title" gorm:"type:varchar(100);not null"` // 加上 gorm tag 限制长度
	Content   string    `json:"content" gorm:"type:text"`                // 内容可能很长
	StartTime time.Time `json:"startTime"`                               // 使用 time.Time
	EndTime   time.Time `json:"endTime"`
	Status    string    `json:"status" gorm:"default:'draft'"` // 默认为草稿
	Level     string    `json:"level" gorm:"default:'info'"`   // 默认为普通
}
