# Go-Practice 项目

这是一个基于 Go 语言开发的后端练习项目，采用了标准的工程化结构和主流的开源库，旨在实现一个高性能、可扩展的 Web 服务。

## 🚀 技术栈

- **Web 框架**: [Gin](https://github.com/gin-gonic/gin)
- **数据库 ORM**: [GORM](https://gorm.io/)
- **配置管理**: [Viper](https://github.com/spf13/viper) (支持热重载)
- **缓存/黑名单**: [Redis](https://redis.io/)
- **身份验证**: [JWT (JSON Web Token)](https://github.com/golang-jwt/jwt)
- **日志系统**: [Zap](https://github.com/uber-go/zap)
- **参数校验**: [Validator](https://github.com/go-playground/validator)
- **数据转换**: [Copier](https://github.com/jinzhu/copier)

## 📂 项目结构

```text
e:/wwt-study/projects/go-practice
├── cmd/                # 程序入口
│   └── server/         # 主服务启动目录
├── configs/            # 配置文件 (config.yaml)
├── internal/           # 内部业务逻辑 (不对外暴露)
│   ├── api/            # 控制器层 (Handler)
│   ├── service/        # 业务逻辑层 (Service)
│   ├── repository/     # 数据访问层 (Repository)
│   ├── model/          # 模型定义 (Entity & DTO)
│   ├── router/         # 路由定义
│   ├── middleware/     # 中间件 (JWT, 日志等)
│   └── initialize/     # 初始化逻辑 (Gorm, Redis, Viper)
├── pkg/                # 公共工具包 (可被外部引用)
│   ├── common/         # 公共响应结构与常量
│   ├── global/         # 全局变量 (DB, REDIS, LOG)
│   └── utils/          # 工具函数 (JWT, 加密等)
└── log/                # 运行时日志目录
```

## ✨ 已实现功能

- [x] **用户管理**: 注册、登录、获取当前用户信息。
- [x] **身份验证**: 基于 JWT 的身份校验中间件。
- [x] **安全退出**: 利用 Redis 实现 JWT 黑名单机制，支持强制下线。
- [x] **分页查询**: 支持所有用户列表的分页查询。
- [x] **模糊搜索**: 支持根据用户名关键词进行模糊搜索并分页。
- [x] **配置热重载**: 修改 `config.yaml` 后无需重启服务即可生效。
- [x] **工程化规范**: 严格的 Repo-Service-API 三层架构，遵循 DIP 原则。

## 🛠️ 快速开始

### 1. 环境准备

- Go 1.20+
- MySQL 8.0+
- Redis 6.0+

### 2. 配置文件

复制并修改配置文件（如果存在 `.env` 或 `config.yaml`）：

```bash
# 确保 configs/config.yaml 中的数据库和 Redis 信息正确
```

### 3. 运行项目

```bash
# 安装依赖
go mod tidy

# 启动服务
go run ./cmd/server
```

## 接口示例

### 1. 用户分页搜索

- **URL**: `GET /api/v1/users/search`
- **参数**: `keyword` (可选), `page` (默认 1), `pageSize` (默认 10)
- **鉴权**: 需要在 Header 中携带 `Authorization: Bearer <token>`

## 📝 开发规范

1. **命名规范**: 遵循 Go 官方建议，使用驼峰命名，导出变量/函数首字母大写。
2. **错误处理**: 禁止静默失败，所有错误必须处理或向上抛出。
3. **代码分层**:
   - `Repository`: 仅处理数据库 CRUD。
   - `Service`: 处理核心业务逻辑，不直接操作数据库。
   - `API`: 处理请求绑定与响应返回。
