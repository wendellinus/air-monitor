package cache

import (
	"context"
	"errors"
	"time"
)

// ErrCacheMiss 缓存未命中错误
var ErrCacheMiss = errors.New("cache: key not found")

// Cache 缓存抽象接口
// 任何缓存实现 (Redis, Memcached, 内存) 都可以实现此接口
// 遵循依赖倒置原则：上层依赖抽象，不依赖具体实现
type Cache interface {
	// Get 获取缓存，未命中时返回 ErrCacheMiss
	Get(ctx context.Context, key string) ([]byte, error)

	// Set 设置缓存，ttl 为过期时间
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error

	// Delete 删除缓存
	Delete(ctx context.Context, key string) error
}
