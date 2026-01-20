package model

import (
	"go-pratice/internal/module/shared/model"


)

// User 用户实体
// 继承 GVA_MODEL 自动获得 ID, CreatedAt, UpdatedAt, DeletedAt
type User struct {
	model.GVA_MODEL
	Username string `json:"username" gorm:"uniqueIndex;type:varchar(20);not null;comment:用户名"` // uniqueIndex 保证唯一
	Password string `json:"-"  gorm:"comment:用户登录密码;size:128"`                 // json:"-" 表示查询时不返回密码给前端
	Email    string `json:"email" gorm:"comment:邮箱;size:64"`
	Phone    string `json:"phone" gorm:"comment:手机号;size:16"`
	IsActive bool   `json:"isActive" gorm:"default:true;comment:是否激活"`
}
