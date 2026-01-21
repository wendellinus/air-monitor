package middleware

import (
	"context"
	"go-pratice/pkg/common/constant"
	"go-pratice/pkg/common/response"
	"go-pratice/pkg/global"
	"go-pratice/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// JWTAuth JWT 中间件
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 获取 Header 中的 Authorization
		tokenString := c.GetHeader("Authorization")

		// 2. 校验格式 "Bearer <token>"
		if tokenString == "" {
			// 这里我们使用 http.StatusUnauthorized (401)，这会让 Axios 进入 .catch()
			// 或者你可以选择用 response.Result(200, 401, nil, "...", c) 来让前端在 .then 里处理
			response.Fail(c, http.StatusUnauthorized, "未登录或非法访问")
			c.Abort()
			return
		}

		// 去掉 "Bearer " 前缀
		tokenString = tokenString[7:]

		// 【新增步骤 2.5】查 Redis 黑名单
		ctx := context.Background()
		redisKey := "jwt_blacklist:" + tokenString
		// Redis Get 操作，如果没有这个 Key 会返回 redis.Nil 错误
		_, err := global.REDIS.Get(ctx, redisKey).Result()

		if err == nil {
			// 如果 err == nil，说明在 Redis 里找到了这个 Key，即 Token 被拉黑了
			c.JSON(http.StatusUnauthorized, gin.H{"error": "账号已登出，请重新登录"})
			c.Abort()
			return
		}

		// 3. 解析 Token
		claims, err := utils.ParseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token 无效或已过期"})
			c.Abort()
			return
		}

		// 4. 将解析出的 UserID 存入上下文 (Context)
		// 这样后续的 API 就能知道是谁在请求了
		c.Set(string(constant.ContextKeyUserID), claims.UserID)
		c.Set(string(constant.ContextKeyUsername), claims.Username)
		c.Set(string(constant.ContextKeyClaims), claims)

		// 5. 放行
		c.Next()
	}
}
