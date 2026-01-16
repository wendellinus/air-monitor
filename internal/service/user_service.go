package service

import (
	"context"
	"errors"
	"fmt"
	"go-pratice/internal/model"
	"go-pratice/internal/model/dto"
	"go-pratice/internal/repository"
	"go-pratice/pkg/utils"

	"github.com/jinzhu/copier"
	"golang.org/x/crypto/bcrypt"
)

// UserService 定义用户业务逻辑接口
type UserService interface {
	Register(ctx context.Context, username, password, email string) (*dto.UserResponse, error)
	Login(ctx context.Context, username, password string) (*dto.LoginResponse, error)
	GetUserList(ctx context.Context, page, pageSize int) (*dto.PageResult, error)
	SearchUsers(ctx context.Context, keyword string, page, pageSize int) (*dto.PageResult, error)
}

// userService 接口的私有实现
type userService struct {
	userRepo repository.UserRepository // 依赖接口
}

// NewUserService 构造函数
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

// Register 用户注册逻辑
func (s *userService) Register(ctx context.Context, username, password, email string) (*dto.UserResponse, error) {
	// 1. 检查用户是否已存在
	exists, err := s.userRepo.UserExist(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists {
		return nil, errors.New("用户名已存在")
	}

	// 2. 密码加密 (Bcrypt)
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// 3. 构建 User 对象
	user := &model.User{
		Username: username,
		Password: string(hash), // 存密文
		Email:    email,
		IsActive: true,
	}

	// 4. 落库
	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// 5. 返回 DTO
	var userDto dto.UserResponse
	if err := copier.Copy(&userDto, user); err != nil {
		return nil, fmt.Errorf("failed to copy dto: %w", err)
	}
	return &userDto, nil
}

// Login 登录逻辑
func (s *userService) Login(ctx context.Context, username, password string) (*dto.LoginResponse, error) {
	// 1. 查找用户
	user, err := s.userRepo.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("用户不存在")
	}

	// 2. 校验密码 (比对哈希)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("密码错误")
	}

	// 3. 生成 Token
	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	var userDto dto.UserResponse
	if err := copier.Copy(&userDto, user); err != nil {
		return nil, fmt.Errorf("failed to copy dto: %w", err)
	}

	return &dto.LoginResponse{
		Token: token,
		User:  userDto,
	}, nil
}

// 实现方法
func (s *userService) GetUserList(ctx context.Context, page, pageSize int) (*dto.PageResult, error) {
	// 1. 调用 Repo 获取数据
	users, total, err := s.userRepo.GetUserList(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	// 2. 转换为 DTO (避免把密码等敏感字段返回)
	var userDtos []dto.UserResponse
	// 使用 copier 批量转换，或者手动遍历转换
	if err := copier.Copy(&userDtos, users); err != nil {
		return nil, fmt.Errorf("failed to copy user dtos: %w", err)
	}
	// 3. 组装分页结果
	return &dto.PageResult{
		List:     userDtos,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *userService) SearchUsers(ctx context.Context, keyword string, page, pageSize int) (*dto.PageResult, error) {
	users, total, err := s.userRepo.SearchUser(ctx, keyword, page, pageSize)
	if err != nil {
		return nil, err
	}
	var userDtos []dto.UserResponse
	if err := copier.Copy(&userDtos, users); err != nil {
		return nil, fmt.Errorf("failed to copy user dtos: %w", err)
	}

	return &dto.PageResult{
		List:     userDtos,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}
