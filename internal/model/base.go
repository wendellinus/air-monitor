package model

import (
	"time"

	"gorm.io/gorm"
)

// GVA_MODEL 是基础结构体，类似于 TS 的 interface BaseEntity
// 这里的 json tag 是为了序列化给前端时，自动转为小驼峰 (id, createdAt)
type GVA_MODEL struct {
	ID        uint           `gorm:"primarykey" json:"id"` // 主键ID
	CreatedAt time.Time      `json:"createdAt"`            // 创建时间
	UpdatedAt time.Time      `json:"updatedAt"`            // 更新时间
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`       // 软删除 (前端不可见)
}
