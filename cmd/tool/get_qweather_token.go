package main

import (
	"crypto/ed25519"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gopkg.in/yaml.v3"
)

// Config 配置结构
type Config struct {
	QWeather struct {
		PublicID   string `yaml:"public_id"`
		ProjectID  string `yaml:"project_id"`
		PrivateKey string `yaml:"private_key"`
	} `yaml:"qweather"`
}

// 读取 config.yaml
func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取 config.yaml 失败: %w", err)
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("解析 config.yaml 失败: %w", err)
	}
	return &cfg, nil
}

// 生成 JWT Token
func generateJWT(cfg *Config) (string, error) {
	block, _ := pem.Decode([]byte(cfg.QWeather.PrivateKey))
	if block == nil {
		return "", fmt.Errorf("无法解析 PEM")
	}
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("解析私钥失败: %w", err)
	}
	privKey, ok := key.(ed25519.PrivateKey)
	if !ok {
		return "", fmt.Errorf("不是 ed25519 私钥")
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"sub": cfg.QWeather.ProjectID,
		"iss": cfg.QWeather.PublicID,
		"iat": now.Unix(),
		"exp": now.Add(5 * time.Minute).Unix(), // 5分钟有效
	}

	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	token.Header["kid"] = cfg.QWeather.PublicID

	signed, err := token.SignedString(privKey)
	if err != nil {
		return "", fmt.Errorf("签名 JWT 失败: %w", err)
	}

	return signed, nil
}

func main() {
	cfg, err := loadConfig("./configs/config.yaml")
	if err != nil {
		fmt.Println("配置读取失败:", err)
		os.Exit(1)
	}

	token, err := generateJWT(cfg)
	if err != nil {
		fmt.Println("生成 Token 失败:", err)
		os.Exit(1)
	}

	fmt.Println("Bearer " + strings.TrimSpace(token))
}
