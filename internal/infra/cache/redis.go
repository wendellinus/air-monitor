package cache

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache Redis 缓存实现
// 实现 Cache 接口
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache 创建 Redis 缓存实例
func NewRedisCache(client *redis.Client) *RedisCache {
	return &RedisCache{client: client}
}

// Get 从 Redis 获取缓存
func (c *RedisCache) Get(ctx context.Context, key string) ([]byte, error) {
	val, err := c.client.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, ErrCacheMiss
	}
	return val, err
}

// Set 写入 Redis 缓存
func (c *RedisCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

// Delete 删除 Redis 缓存
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// 确保 RedisCache 实现了 Cache 接口 (编译时检查)
var _ Cache = (*RedisCache)(nil)
