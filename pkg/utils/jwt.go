package utils

import (
	"errors"
	"go-pratice/pkg/global"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims 自定义载荷
type CustomClaims struct {
	UserID   uint   `json:"userId"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken 生成 JWT
func GenerateToken(userID uint, username string) (string, error) {
	// 1. 获取配置
	jwtCfg := global.CONF.JWT

	// 2. 解析过期时间 (字符串转 Duration)
	duration, err := time.ParseDuration(jwtCfg.ExpiresTime)
	if err != nil {
		duration = 24 * time.Hour // 默认兜底
	}

	// 3. 创建 Claims
	claims := CustomClaims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)), // 过期时间
			Issuer:    jwtCfg.Issuer,                                // 签发者
			NotBefore: jwt.NewNumericDate(time.Now()),               // 生效时间
		},
	}

	// 4. 使用 HS256 签名算法创建 Token 对象
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 5. 使用密钥签名并生成字符串
	return token.SignedString([]byte(jwtCfg.SigningKey))
}

// ParseToken 解析 JWT
func ParseToken(tokenString string) (*CustomClaims, error) {
	jwtCfg := global.CONF.JWT

	// 解析 Token
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtCfg.SigningKey), nil
	})

	if err != nil {
		return nil, err
	}

	// 验证 Claims 类型和有效性
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
