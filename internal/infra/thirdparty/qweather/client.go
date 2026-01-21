package qweather

import (
	"compress/gzip"
	"context"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	// 默认超时时间
	defaultTimeout = 10 * time.Second
	// Token 提前刷新时间 (过期前 1 分钟刷新)
	tokenRefreshWindow = 1 * time.Minute
	// JWT 有效期
	tokenDuration = 5 * time.Minute
)

// API Paths
const (
	pathGeoLookup   = "/geo/v2/city/lookup"
	pathGeoTop      = "/geo/v2/city/top"
	pathAirCurrent  = "/airquality/v1/current/%s/%s" // lat, lon
	pathAirHourly   = "/airquality/v1/hourly/%s/%s"  // lat, lon
)

// Config SDK 配置
// 解耦设计：不再依赖 internal/config，由外部传入必要参数
type Config struct {
	Key        string        // API Key (降级使用)
	PublicID   string        // JWT Public ID
	PrivateKey string        // JWT Private Key (PEM)
	ProjectID  string        // JWT Project ID
	Host       string        // API Host (e.g. https://devapi.qweather.com)
	Timeout    time.Duration // 请求超时
}

// Client 和风天气客户端
type Client struct {
	cfg        Config
	httpClient *http.Client

	// Token 缓存机制
	tokenMu  sync.RWMutex
	token    string
	tokenExp time.Time
}

// NewClient 初始化客户端
func NewClient(cfg Config) *Client {
	if cfg.Timeout <= 0 {
		cfg.Timeout = defaultTimeout
	}
	return &Client{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
	}
}

// GetGeo 获取城市 Geo 信息
func (c *Client) GetGeo(ctx context.Context, keyword string) (*GeoDTO, error) {
	params := url.Values{}
	params.Set("location", keyword)

	var result GeoDTO
	if err := c.request(ctx, http.MethodGet, pathGeoLookup, params, &result); err != nil {
		return nil, err
	}

	// 业务层错误检查 (Geo API 返回 code 字段)
	if result.Code != "200" {
		return nil, fmt.Errorf("和风天气 Geo API 错误: code=%s", result.Code)
	}

	return &result, nil
}

// GetAQI 获取实时空气质量
func (c *Client) GetAQI(ctx context.Context, lat, lon string) (*AQIDTO, error) {
	// 保持原有 Path 逻辑 (注意：此路径非和风标准公开 API，可能是定制或代理)
	path := fmt.Sprintf(pathAirCurrent, lat, lon)

	var result AQIDTO
	if err := c.request(ctx, http.MethodGet, path, nil, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetHourlyAQI 获取小时级空气质量
func (c *Client) GetHourlyAQI(ctx context.Context, lat, lon string) (*HourlyAQIDTO, error) {
	path := fmt.Sprintf(pathAirHourly, lat, lon)

	var result HourlyAQIDTO
	if err := c.request(ctx, http.MethodGet, path, nil, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetTopCities 获取热门城市
func (c *Client) GetTopCities(ctx context.Context, rangeType string, number int) (*TopCityDTO, error) {
	params := url.Values{}
	params.Set("range", rangeType)
	params.Set("number", strconv.Itoa(number))

	var result TopCityDTO
	if err := c.request(ctx, http.MethodGet, pathGeoTop, params, &result); err != nil {
		return nil, err
	}

	if result.Code != "200" {
		return nil, fmt.Errorf("和风天气热门城市 API 错误: code=%s", result.Code)
	}

	return &result, nil
}

// request 统一请求处理：构建 URL -> 获取 Token -> 发送请求 -> 解析响应
func (c *Client) request(ctx context.Context, method, path string, params url.Values, dest interface{}) error {
	if c.cfg.Host == "" {
		return errors.New("未配置和风天气 API Host")
	}

	// 1. 构建 URL
	fullURL := c.cfg.Host + path
	if len(params) > 0 {
		fullURL += "?" + params.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, nil)
	if err != nil {
		return fmt.Errorf("创建请求失败: %w", err)
	}

	// 2. 注入认证 Token
	token, err := c.ensureToken()
	if err != nil {
		return err
	}
	c.setAuthHeader(req, token)

	// 3. 执行 HTTP 请求
	body, err := c.do(req)
	if err != nil {
		return err
	}

	// 4. 解析响应
	if err := json.Unmarshal(body, dest); err != nil {
		return fmt.Errorf("解析响应失败: %w, body: %s", err, string(body))
	}

	return nil
}

// do 执行底层 HTTP 请求，处理 Header 和 Gzip
func (c *Client) do(req *http.Request) ([]byte, error) {
	// 模拟浏览器指纹，防止被某些 WAF 拦截
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP 请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 处理 Gzip
	var reader io.ReadCloser
	switch resp.Header.Get("Content-Encoding") {
	case "gzip":
		if r, err := gzip.NewReader(resp.Body); err == nil {
			reader = r
			defer reader.Close()
		} else {
			return nil, fmt.Errorf("Gzip 解压失败: %w", err)
		}
	default:
		reader = resp.Body
	}

	body, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("读取响应体失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API HTTP 错误: status=%d body=%s", resp.StatusCode, string(body))
	}

	return body, nil
}

// ensureToken 获取有效 Token (支持缓存和自动刷新)
func (c *Client) ensureToken() (string, error) {
	// 1. 优先检查缓存
	c.tokenMu.RLock()
	if c.token != "" && time.Now().Add(tokenRefreshWindow).Before(c.tokenExp) {
		defer c.tokenMu.RUnlock()
		return c.token, nil
	}
	c.tokenMu.RUnlock()

	// 2. 缓存失效，加写锁重新生成
	c.tokenMu.Lock()
	defer c.tokenMu.Unlock()

	// 双重检查 (防止并发穿透)
	if c.token != "" && time.Now().Add(tokenRefreshWindow).Before(c.tokenExp) {
		return c.token, nil
	}

	// 生成新 Token
	token, err := c.generateToken()
	if err != nil {
		return "", err
	}

	// 更新缓存
	c.token = token
	// 如果是 JWT，设置过期时间；如果是 API Key，设置较长过期时间或不设置
	if c.isJWTMode() {
		c.tokenExp = time.Now().Add(tokenDuration)
	} else {
		c.tokenExp = time.Now().Add(24 * time.Hour) // API Key 长期有效，但也定期刷新一下无妨
	}

	return c.token, nil
}

// generateToken 生成 Token 核心逻辑
func (c *Client) generateToken() (string, error) {
	// 模式 A: JWT (优先)
	if c.isJWTMode() {
		return c.signJWT()
	}

	// 模式 B: API Key
	if c.cfg.Key != "" {
		return c.cfg.Key, nil
	}

	return "", errors.New("未配置有效凭证 (JWT 或 API Key)")
}

func (c *Client) isJWTMode() bool {
	return c.cfg.PublicID != "" && c.cfg.PrivateKey != ""
}

func (c *Client) signJWT() (string, error) {
	block, _ := pem.Decode([]byte(c.cfg.PrivateKey))
	if block == nil {
		return "", errors.New("解析私钥 PEM 失败")
	}

	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("解析私钥失败: %w", err)
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"sub": c.cfg.ProjectID,
		"iss": c.cfg.PublicID,
		"iat": now.Unix(),
		"exp": now.Add(tokenDuration).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	token.Header["kid"] = c.cfg.PublicID

	signed, err := token.SignedString(privKey)
	if err != nil {
		return "", fmt.Errorf("签名 JWT 失败: %w", err)
	}

	return "Bearer " + signed, nil
}

func (c *Client) setAuthHeader(req *http.Request, token string) {
	if len(token) > 7 && token[:7] == "Bearer " {
		req.Header.Set("Authorization", token)
	} else {
		req.Header.Set("X-QW-Api-Key", token)
	}
}
