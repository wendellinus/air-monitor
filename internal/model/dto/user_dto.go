package dto

import "time"

// UserResponse 用户信息响应 DTO
type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

// LoginResponse 登录响应 DTO
type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}
