package api

import (
	"go-pratice/internal/module/user/service"
	"go-pratice/pkg/common/constant"
	"go-pratice/pkg/common/response"
	"go-pratice/pkg/global"
	"go-pratice/pkg/utils"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type UserApi struct {
	userService service.UserService // 依赖接口
}

func NewUserApi(userService service.UserService) *UserApi {
	return &UserApi{
		userService: userService,
	}
}

// RegisterRequest 注册请求参数 DTO
type RegisterRequest struct {
	Username string `json:"username" binding:"required"` // binding:"required" 类似 Joi/Zod 校验
	Password string `json:"password" binding:"required,min=6"`
	Email    string `json:"email" binding:"email"`
}

// Register 用户注册
// @Summary 用户注册
// @Description 用户注册接口
// @Tags User
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册参数"
// @Success 200 {object} response.Response{data=dto.UserResponse}
// @Router /api/v1/register [post]
func (a *UserApi) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数校验失败: "+err.Error(), c)
		return
	}

	// 传入 Context
	user, err := a.userService.Register(c.Request.Context(), req.Username, req.Password, req.Email)
	if err != nil {
		global.LOG.Error("注册失败", zap.Error(err))
		response.FailWithMessage(err.Error(), c)
		return
	}

	response.OkWithDetailed(user, "注册成功", c)
}

// LoginRequest 登录参数
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login 用户登录
func (a *UserApi) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	// 传入 Context
	loginResp, err := a.userService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		global.LOG.Error("登录失败", zap.Error(err))
		response.FailWithMessage("用户名或密码错误", c)
		return
	}

	response.OkWithDetailed(loginResp, "登录成功", c)
}

// GetUserInfo 获取当前登录用户信息
func (a *UserApi) GetUserInfo(c *gin.Context) {
	userID, _ := c.Get(string(constant.ContextKeyUserID))
	username, _ := c.Get(string(constant.ContextKeyUsername))

	response.OkWithData(gin.H{
		"id":       userID,
		"username": username,
	}, c)
}

// Logout 退出登录
func (a *UserApi) Logout(c *gin.Context) {
	claimsInterface, exists := c.Get(string(constant.ContextKeyClaims))
	if !exists {
		response.OkWithMessage("已登出", c)
		return
	}
	claims := claimsInterface.(*utils.CustomClaims)

	tokenString := c.GetHeader("Authorization")[7:]

	now := time.Now()
	expTime := claims.ExpiresAt.Time
	duration := expTime.Sub(now)

	if duration > 0 {
		ctx := c.Request.Context() // 使用 Request Context
		redisKey := "jwt_blacklist:" + tokenString
		err := global.REDIS.Set(ctx, redisKey, 1, duration).Err()

		if err != nil {
			global.LOG.Error("Redis 设置黑名单失败", zap.Error(err))
			response.FailWithMessage("登出失败", c)
			return
		}
	}

	response.OkWithMessage("登出成功", c)
}

type PageRequest struct {
	Page     int `from:"page,default=1"`
	PageSize int `from:"pageSize,default=10"`
}

// GetUserList 分页获取用户列表
// @Router /api/v1/users [get]
func (a *UserApi) GetUserList(c *gin.Context) {
	var req PageRequest
	// ShouldBindQuery 用于绑定 URL 查询参数 (?page=1&pageSize=10)
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	// 调用 Service
	pageResult, err := a.userService.GetUserList(c.Request.Context(), req.Page, req.PageSize)
	if err != nil {
		global.LOG.Error("获取用户列表失败", zap.Error(err))
		response.FailWithMessage("获取列表失败", c)
		return
	}
	// 返回成功响应
	response.OkWithDetailed(pageResult, "获取成功", c)
}

type SearchUserRequest struct {
	Keywork  string `form:"keyword"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=10"`
}

func (a *UserApi) SearchUser(c *gin.Context) {
	var req SearchUserRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	result, err := a.userService.SearchUsers(c.Request.Context(), req.Keywork, req.Page, req.PageSize)
	if err != nil {
		global.LOG.Error("搜索用户列表失败", zap.Error(err))
		response.FailWithMessage("搜索用户失败", c)
		return
	}

	response.OkWithDetailed(result, "获取成功", c)
}
