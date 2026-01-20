# Go 后端架构重构方案：从“分层架构”走向“领域模块化”

## 1. 为什么大企业不推荐纯“Controller-Service-Dao”分层？

在项目初期，`api/`, `service/`, `model/` 这种按**技术职责**水平分层的结构非常直观。但随着业务增长（如阿里/字节的复杂业务场景），这种结构会暴露致命缺陷：

1.  **低内聚（Low Cohesion）**：
    - 开发一个“查询城市空气”的功能，你需要同时修改 `api/city.go`, `service/city.go`, `model/city.go`, `router/router.go`。
    - 文件散落在不同目录下，代码跳转频繁，认知负荷高。
2.  **高耦合（High Coupling）**：
    - `service` 目录下的所有服务往往互相引用，容易形成“大泥球（Big Ball of Mud）”。
    - 难以拆分微服务：如果想把“空气质量”拆成独立服务，你很难从混杂的 `service` 目录中剥离出只属于它的代码。
3.  **职责不清**：
    - `model` 往往变成了贫血模型（只有字段没有方法），业务逻辑泄露到 `service` 甚至 `controller` 中。

**工业级架构的核心理念**：**按业务域（Domain）垂直切分，而非按技术层水平切分。**

---

## 2. 工业级推荐目录结构

我们采用 **“模块化单体（Modular Monolith）”** 结构。这种结构既保持了单体开发的便利性，又具备了微服务的隔离性。

### 推荐结构概览

```text
cmd/
  server/
    main.go           # 仅负责组装模块、启动服务

configs/              # 配置文件

internal/
  # 1. 基础设施层 (Infrastructure) - 与业务无关的底层支撑
  infra/
    persistence/      # 数据库/Redis 初始化
    thirdparty/       # 第三方客户端 (QWeather SDK 封装)
    pkg/              # 内部工具包 (Logger, Error, ContextUtil)

  # 2. 业务模块层 (Modules/Domains) - 核心重构点
  module/
    # 模块 A: 城市管理
    city/
      api/            # Handler (HTTP 接口)
      service/        # 业务逻辑接口与实现
      repository/     # 数据访问接口与实现
      model/          # 领域模型 (Entity) & DTO
      router.go       # 该模块的路由注册入口

    # 模块 B: 空气质量
    air/
      api/
      service/
      repository/
      model/
      router.go

    # 模块 C: 地图大屏
    mapviz/
      ...

  # 3. 全局共享 (Shared Kernel) - 仅放真正的公共代码
  shared/
    consts/
    middleware/
```

---

## 3. 职责边界说明

在 `internal/module/{domain}` 内部，我们依然保留分层，但作用域仅限于当前模块。

| 目录           | 角色   | 职责                                                                | 依赖规则                                                                       |
| :------------- | :----- | :------------------------------------------------------------------ | :----------------------------------------------------------------------------- |
| **api**        | 接口层 | 解析 HTTP 请求，参数校验，调用 Service，封装 Response。             | ✅ 依赖 `service`, `model` (DTO)<br>❌ **严禁** 依赖 `repository`              |
| **service**    | 业务层 | 核心业务逻辑，事务控制，缓存策略。                                  | ✅ 依赖 `repository`, `model`, `infra`<br>❌ **严禁** 依赖 `api` (Gin Context) |
| **repository** | 数据层 | 数据库 CRUD，Redis 操作，第三方 API 调用。                          | ✅ 依赖 `model`, `infra` (DB/Client)<br>❌ **严禁** 依赖 `service`             |
| **model**      | 模型层 | **Entity**: 数据库表映射<br>**DTO**: 前端交互对象<br>**VO**: 值对象 | ❌ **不依赖任何层** (最底层)                                                   |

**关键原则**：

- **模块间隔离**：`city` 模块 **不应该直接 import** `air` 模块的 `repository`。如果需要交互，必须通过 `service` 层公开的接口，或者通过事件总线（Event Bus）。

---

## 4. 迁移方案：从“分层”到“模块化”的安全步骤

我们不建议一次性推翻，而是采用 **“绞杀者模式（Strangler Fig Pattern）”** 逐步迁移。

### 步骤 1：建立新结构骨架

在 `internal` 下创建 `module/` 和 `infra/` 目录。

### 步骤 2：基础设施下沉 (Infrastructure Sinking)

- 将 `internal/repository/qweather_repo.go` (第三方API) 移动到 `internal/infra/thirdparty/qweather/`。
- 将 `pkg/global` 中的 DB/Redis 初始化逻辑移动到 `internal/infra/persistence/`。
- **目的**：让业务模块只关注业务，不再关心底层连接怎么连。

### 步骤 3：提取第一个业务模块 (City)

1.  创建 `internal/module/city/`。
2.  将 `internal/model/city.go` 移入 `internal/module/city/model/`。
3.  将 `internal/repository/city_repo.go` (如有) 移入 `internal/module/city/repository/`。
4.  将 `internal/service/city_service.go` (如有) 移入 `internal/module/city/service/`。
5.  **修正 import 路径**。

### 步骤 4：路由注册重构

- 在 `internal/module/city/` 下创建 `router.go`，暴露一个 `RegisterRoutes(r *gin.RouterGroup)` 方法。
- 在 `cmd/server/main.go` 或 `internal/router/router.go` 中，改为调用各模块的 `RegisterRoutes`。

### 步骤 5：清理旧目录

当所有功能都迁移到 `module/` 下后，删除顶层的 `api/`, `service/`, `repository/`, `model/` 目录。

---

## 5. 优势分析

### 5.1 功能扩展 (Feature Scaling)

- **场景**：新增“用户收藏城市”功能。
- **优势**：直接新建 `internal/module/user/`，所有代码都在这里。不会干扰到“空气质量”模块的代码，开发心智负担极低。

### 5.2 新人接手 (Onboarding)

- **场景**：新来一个实习生，让他负责“地图大屏”优化。
- **优势**：告诉他“你只看 `internal/module/mapviz` 这个文件夹”，他不需要理解整个项目几十个文件的复杂关系，改坏了也只影响这一个模块。

### 5.3 微服务拆分 (Microservices Split)

- **场景**：空气质量数据量太大，需要独立部署。
- **优势**：直接把 `internal/module/air` 文件夹拷贝到一个新仓库，改一下 `main.go`，一个微服务就拆分完成了。90% 的代码不需要改动。

### 5.4 长期维护 (Maintainability)

- **场景**：2年后，项目变得很大。
- **优势**：模块化结构强制了“高内聚”，避免了“上帝类（God Class）”的出现。每个模块的体积都控制在可理解的范围内。

---

## 6. 总结

**“分层架构”是战术上的勤奋，“模块化架构”是战略上的优选。**

对于你现在的阶段，虽然项目还不大，但尽早按 **Feature/Domain** 组织代码，能让你在后续增加 `Map`, `History`, `User` 等功能时，依然保持代码库的清爽和可维护性。
