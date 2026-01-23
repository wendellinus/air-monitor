package utils

import (
	"errors"
	"fmt"
	"go-pratice/pkg/global"
	"strings"
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

// ExtractBearerToken 从 Authorization 头部安全地提取 Bearer Token
// 支持格式: "Bearer <token>" 或 "bearer <token>" (大小写不敏感)
// 自动处理多余空格
func ExtractBearerToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("authorization header is empty")
	}

	// 转换为小写进行前缀匹配，但保留原始值
	lowerHeader := strings.ToLower(strings.TrimSpace(authHeader))
	const bearerPrefix = "bearer "

	// 检查是否以 "bearer " 开头
	if !strings.HasPrefix(lowerHeader, bearerPrefix) {
		return "", errors.New("authorization header must start with 'Bearer '")
	}

	// 提取 token 部分（去掉 "Bearer " 前缀）
	token := strings.TrimSpace(authHeader[len(bearerPrefix):])
	if token == "" {
		return "", errors.New("token is empty after 'Bearer ' prefix")
	}

	return token, nil
}

// DecodeTokenWithoutVerification 解析JWT token内容（不验证签名，仅用于查看）
// 返回token的header、payload和原始claims map
// 注意：此函数不验证签名，仅用于调试和查看token内容
func DecodeTokenWithoutVerification(tokenString string) (map[string]interface{}, error) {
	// 使用 jwt.ParseUnverified 不验证签名，只解析内容
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("解析token失败: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("无法解析claims")
	}

	result := make(map[string]interface{})
	result["header"] = token.Header
	result["claims"] = claims

	// 格式化时间字段
	if exp, ok := claims["exp"].(float64); ok {
		result["expiresAt"] = time.Unix(int64(exp), 0).Format(time.RFC3339)
	}
	if iat, ok := claims["iat"].(float64); ok {
		result["issuedAt"] = time.Unix(int64(iat), 0).Format(time.RFC3339)
	}
	if nbf, ok := claims["nbf"].(float64); ok {
		result["notBefore"] = time.Unix(int64(nbf), 0).Format(time.RFC3339)
	}

	return result, nil
}
