# 城市空气质量可视化系统 - 后端架构设计文档

## 1. 系统整体设计概览

### 1.1 核心职责

本系统的后端定位为 **“数据聚合与分发网关”**。

- **数据源**：不生产数据，依赖第三方（和风天气）API。
- **核心能力**：数据清洗、持久化存储（MySQL）、高性能缓存（Redis）、标准 API 暴露。

### 1.2 分层架构设计

遵循 `Standard Go Project Layout` 变体，采用严格的分层架构：

| 层级       | 目录位置              | 职责关键词      | 详细说明                                                                                         |
| :--------- | :-------------------- | :-------------- | :----------------------------------------------------------------------------------------------- |
| **接入层** | `internal/router`     | **路由/中间件** | 注册路由，绑定中间件（CORS, Auth, Logger）。                                                     |
| **控制层** | `internal/api`        | **参数/响应**   | 解析 HTTP 请求，参数校验，调用 Service，封装统一响应格式。**不包含业务逻辑**。                   |
| **业务层** | `internal/service`    | **逻辑/编排**   | 核心大脑。决定“查缓存/查DB/调API”，处理数据组装与降级策略。                                      |
| **数据层** | `internal/repository` | **CRUD/Fetch**  | **关键设计**：统一封装 DB、Redis 和 **第三方 API** 的调用。对 Service 而言，API 也是一种数据源。 |
| **模型层** | `internal/model`      | **结构体**      | 定义数据库表结构（Entity）和核心业务对象。                                                       |

---

## 2. 线性实现计划（Roadmap）

### 阶段 1：数据源接入与模型定义（基石）

- **目标**：打通和风天气 API，完成基础数据结构定义。
- **任务**：
  1. `internal/model`：定义 `City` 和 `AirQuality` 结构体。
  2. `internal/repository`：实现 `qweather_repo.go`，封装 `http.Client` 调用第三方 API。
  3. **验证**：单元测试能成功打印 API 返回的原始 JSON。

### 阶段 2：核心业务逻辑与持久化（骨架）

- **目标**：实现“查询 -> 缺数据调 API -> 存库 -> 返回”的闭环。
- **任务**：
  1. `internal/repository`：实现 `city_db.go` 和 `aqi_db.go`（GORM 操作）。
  2. `internal/service`：实现 `CityService` 和 `AQIService`。
  3. **逻辑**：Service 优先查 DB，未命中则调用 Repo 的 API 方法，随后异步入库。
  4. **验证**：调用 Service 方法后，数据库中新增相应记录。

### 阶段 3：接口暴露与前端联调（MVP）

- **目标**：前端可对接标准 HTTP 接口。
- **任务**：
  1. `internal/api`：编写 Handler（如 `GetCityAQI`）。
  2. `internal/router`：注册路由组（如 `/api/v1/weather`）。
  3. **验证**：Postman 请求接口返回标准 JSON 响应。

### 阶段 4：缓存层接入（性能优化）

- **目标**：降低 API 调用频率，提升响应速度。
- **任务**：
  1. `internal/repository`：增加 Redis 操作封装。
  2. `internal/service`：实现 **Cache -> DB -> API** 的多级降级策略。
  3. **验证**：二次请求响应时间 < 5ms。

---

## 3. 核心功能模块设计

### 3.1 城市搜索 (Geo)

- **场景**：用户输入“北京”，返回城市 ID 及经纬度。
- **数据流**：
  1. **API 层**：接收 `keyword`。
  2. **Service 层**：
     - 查 DB (`WHERE name LIKE ?`)。
     - Miss -> 调和风 Geo API。
     - 结果异步写入 DB（构建本地城市库）。
     - 返回结果。

### 3.2 空气质量实时查询

- **场景**：根据 CityID 展示 AQI、PM2.5。
- **数据流**：
  1. **Service 层**：
     - **Redis** (`get aqi:id`) -> Hit 则返回。
     - Miss -> **API** (调和风)。
     - **Redis** (SetEX 1小时)。
     - **DB** (异步存历史记录)。

### 3.3 地图大屏数据接口

- **场景**：一次性返回全国热门 50 个城市的 AQI。
- **优化**：
  - 使用 **Redis Pipeline** 批量获取。
  - 结合 `Goroutine` 并发处理缺失数据的 API 补全。

### 3.4 缓存策略

- **Key 设计**：
  - 城市信息：`geo:city:{name}` (TTL: 30天)
  - 实时空气：`aqi:current:{city_id}` (TTL: 30分钟)

---

## 4. 关键代码设计说明

### 4.1 目录职责推荐

```text
cmd/server/          # main.go 入口
configs/             # 配置文件
internal/
  api/               # Controller: 解析请求, 调 Service
  service/           # Business: 逻辑编排, 缓存控制
  repository/        # Data Access:
    dao/             # DB 操作 (GORM)
    cache/           # Redis 操作
    thirdparty/      # 和风 API 客户端封装
  model/
    entity/          # DB Table Struct
    dto/             # API Request/Response Struct
pkg/
  global/            # 全局对象 (DB, Redis, Logger)
  utils/             # 通用工具
```

### 4.2 核心 Service 伪代码

```go
func (s *AQIService) GetCurrentAQI(ctx context.Context, cityID string) (*dto.AQIResponse, error) {
    // 1. Check Redis
    if cached, err := s.repo.GetAQICache(ctx, cityID); err == nil {
        return cached, nil
    }

    // 2. Fetch from Remote API
    data, err := s.remoteRepo.FetchAQI(ctx, cityID)
    if err != nil {
        return nil, fmt.Errorf("fetch remote failed: %w", err)
    }

    // 3. Async Save (DB & Cache)
    go func() {
        saveCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        s.repo.SaveAQI(saveCtx, data)
        s.repo.SetAQICache(saveCtx, cityID, data)
    }()

    return s.toDTO(data), nil
}
```

---

## 5. 关键技术点

1.  **http.Client 复用**：全局初始化一个 `HttpClient`，设置 `MaxIdleConns` 和 `Timeout`，避免频繁创建导致端口耗尽。
2.  **Context 传递**：Gin 的 `c.Request.Context()` 必须透传至 Service 和 Repository，确保请求取消时能中断耗时操作。
3.  **Goroutine 并发**：在聚合接口（如地图大屏）使用 `sync.WaitGroup` 或 `errgroup` 并发请求多个城市数据。
4.  **错误处理**：Repository 返回原始 error，Service 层 wrap 错误上下文 (`fmt.Errorf("...: %w", err)`)，API 层统一处理 HTTP 状态码。

## 6. 可扩展性

- **新数据源**：只需在 `repository/thirdparty` 实现新的 `WeatherSource` 接口。
- **WebSocket**：在 `api` 层新增 WS Handler，复用现有 `Service` 逻辑推送数据。
