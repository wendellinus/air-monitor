package repository

import (
	"context"
	"errors"
	"fmt"
	userModel "go-pratice/internal/module/user/model"

	"gorm.io/gorm"
)

// UserRepository 定义用户数据访问接口
// 遵循 DIP 原则，上层依赖接口而非实现
type UserRepository interface {
	CreateUser(ctx context.Context, user *userModel.User) error
	GetUserByUsername(ctx context.Context, username string) (*userModel.User, error)
	UserExist(ctx context.Context, username string) (bool, error)
	GetUserList(ctx context.Context, page int, pageSize int) ([]userModel.User, int64, error)
	SearchUser(ctx context.Context, keyword string, page, pageSize int) ([]userModel.User, int64, error)
}

// userRepository 接口的私有实现
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 构造函数，返回接口类型
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// CreateUser 创建用户
func (r *userRepository) CreateUser(ctx context.Context, user *userModel.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

// GetUserByUsername 根据用户名查找
func (r *userRepository) GetUserByUsername(ctx context.Context, username string) (*userModel.User, error) {
	var user userModel.User
	err := r.db.WithContext(ctx).Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

// UserExist 判断用户是否存在
func (r *userRepository) UserExist(ctx context.Context, username string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&userModel.User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}
	return count > 0, nil
}

func (r *userRepository) GetUserList(ctx context.Context, page int, pageSize int) ([]userModel.User, int64, error) {
	var users []userModel.User
	var total int64
	db := r.db.WithContext(ctx).Model(&userModel.User{})
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}
	err := db.Offset((page - 1) * pageSize).Limit(pageSize).Find(&users).Error
	return users, total, err
}

func (r *userRepository) SearchUser(ctx context.Context, keyword string, page, pageSize int) ([]userModel.User, int64, error) {
	var users []userModel.User
	var total int64
	db := r.db.WithContext(ctx).Model(&userModel.User{})

	if keyword != "" {
		db = db.Where("username LIKE ?", "%"+keyword+"%")
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}
	return users, total, nil
}
