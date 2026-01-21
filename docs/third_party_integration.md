# 第三方 API 集成架构总结

本文档总结了本项目中集成第三方 API（以和风天气 QWeather 为例）的架构设计模式。该设计遵循 **Clean Architecture** 和 **依赖倒置原则 (DIP)**，旨在实现业务逻辑与外部依赖的解耦。

## 1. 核心设计理念

1.  **基础设施即服务 (Infra as Service)**: 第三方 API 调用被视为基础设施层（Infra Layer）的一部分，而不是业务逻辑。
2.  **接口隔离**: 业务层（Service Layer）只定义它需要的接口（Interface），不关心具体实现。
3.  **防腐层 (Anti-Corruption Layer)**: 通过适配器（Provider）将第三方的原始数据结构（DTO）转换为项目内部的领域模型（Domain Model），防止外部细节污染核心业务。

## 2. 目录结构

```text
internal/
├── config/                  # 1. 全局配置
│   └── config.go            # 定义 Config 结构体
├── module/                  # 2. 业务层
│   ├── air/
│   │   └── service/
│   │       ├── service.go   # 业务逻辑，依赖接口
│   │       └── interface.go # 定义 IAirProvider 接口
├── infra/                   # 3. 基础设施层
│   └── thirdparty/
│       └── qweather/        # 具体实现
│           ├── client.go    # HTTP Client (负责通信)
│           ├── dto.go       # DTO (负责数据映射)
│           └── provider.go  # Adapter (负责实现接口)
└── bootstrap/
    └── boot.go              # 4. 依赖注入 (Wiring)
```

## 3. 组件详解

### 3.1 Config (配置)

配置集中管理，支持多环境切换。

- **位置**: `internal/config/config.go`
- **职责**: 定义 API Key、Host、超时时间等基础参数。

### 3.2 DTO (Data Transfer Object)

- **位置**: `internal/infra/thirdparty/qweather/dto.go`
- **职责**: 完美映射第三方 API 返回的 JSON 结构。
- **原则**: 不做重命名，不做逻辑转换，字段类型与 JSON 保持一致。

### 3.3 Client (HTTP 客户端)

- **位置**: `internal/infra/thirdparty/qweather/client.go`
- **职责**:
  - 处理 HTTP 请求细节（URL 拼接、Header 设置）。
  - 处理认证逻辑（如 JWT 生成、API Key 注入）。
  - 处理原始响应（Gzip 解压、JSON Unmarshal）。
  - **不包含任何业务判断**，只返回 DTO 或底层错误。

### 3.4 Provider (适配器)

- **位置**: `internal/infra/thirdparty/qweather/provider.go`
- **职责**:
  - 实现业务层定义的接口（如 `service.IAirProvider`）。
  - 调用 Client 获取 DTO。
  - 将 DTO 转换为业务领域模型（Domain Model）。
  - 处理数据清洗和默认值逻辑。

## 4. 依赖注入与初始化

在 `internal/bootstrap/boot.go` 中完成组装，确保层级依赖方向正确：

```go
// 1. 初始化 Client (Infra)
qweatherClient := qweather.NewClient(global.CONF.QWeather)

// 2. 初始化 Provider (Infra -> Service Interface Adapter)
qweatherProvider := qweather.NewProvider(qweatherClient)

// 3. 初始化 Service (注入接口实现)
// AirService 依赖 IAirProvider 接口，这里注入的是 qweatherProvider
airMod := air.NewModule(global.DB, qweatherProvider)
```

## 5. 优势总结

1.  **可测试性 (Testability)**:
    - 业务层测试时，可以轻松 Mock `IAirProvider` 接口，无需发起真实网络请求。
2.  **可替换性 (Replaceability)**:
    - 如果未来需要更换天气服务商（如换成高德），只需新建 `infra/thirdparty/amap` 并实现相同接口，业务层代码无需修改。
3.  **关注点分离 (Separation of Concerns)**:
    - 业务开发人员只需关注业务实体（如 `AirQualityLog`），无需了解第三方 API 的具体字段名（如 `pm2p5` vs `pm2.5`）或认证细节。
