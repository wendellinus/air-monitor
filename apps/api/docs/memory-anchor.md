# Memory Anchor (One Page)

这份文档是“记忆锚点版”，用于快速回忆本项目的关键设计与约定。
详细从零启动/全量 API 清单请看：`beginner-guide.md`。

## 1) 这项目是干什么的

- 一个 NestJS API 服务（端口默认 8080），对外统一前缀：`/api/v1`
- 核心功能：用户鉴权（JWT access/refresh）、城市查询、空气质量、通知/预警、少量 provider 示例、WebSocket echo
- 数据层：Postgres（Prisma）+ Redis（缓存/黑名单）
- 第三方：QWeather（支持 API Key 或 JWT/EdDSA）

## 2) 最重要的工程约定（不遵守会怎样）

- 路由前缀固定：`/api/v1`
  - 不这么做：前端/Apifox/文档里的所有路径都会对不上，属于“破坏性改动”
- 响应壳固定：`{ code, msg, data }`；业务错误默认仍返回 HTTP 200
  - 不这么做：前端需要分支处理（HTTP status vs 业务 code），历史约定被打破
- 输入必须 DTO + `class-validator` 校验（全局 `ValidationPipe` 已启用）
  - 不这么做：脏字段进服务层/数据库，安全和稳定性风险显著增大
- 分层：Controller 薄、Service 写业务、Repository 做数据访问
  - 不这么做：控制器膨胀、复用困难、测试困难、改动风险更大

## 3) 目录结构（按职责）

- `apps/api/src/modules/<domain>`：业务模块（auth/user/city/air/notice/provider/ws）
- `apps/api/src/infra`：基础设施（Prisma、Redis、QWeather client/provider）
- `apps/api/src/shared`：横切能力（统一错误/响应、DTO/校验、env 解析）
- `apps/api/prisma/`：数据库 schema + migrations
- `apps/api/docs/`：文档（你正在看的这个 + 新手文档）

## 4) 鉴权设计（Access + Refresh）

- Access Token：短期访问凭证（含 `jti`），用于访问需要登录的接口
- Refresh Token：换取新 access 的长期凭证
- Refresh 旋转：每次 refresh 会生成新的 refresh，并撤销旧的（并支持复用检测）
- Logout：把当前 access 的 `jti` 写入 Redis 黑名单（直到过期），并撤销 refresh

为什么这样设计：
- 只用 access：无法安全“注销/踢下线”，token 泄露后只能等过期
- 只用 refresh：每次请求都拿长期凭证，泄露代价更大
- 不做旋转：refresh 一旦泄露，攻击者可长期续命

## 4.1) 权限设计（RBAC：三种角色）

- 角色：`user / operator / admin`
- 后台接口通过 Guard 强制拦截（前端菜单隐藏不算安全）
- `admin` 可给用户分配角色；`admin/operator` 可做用户管理与公告管理
- 即时失效：当管理员禁用用户/重置密码/改角色时，会自增 `tokenVersion` 并撤销 refresh token，旧 access token 立即不可用

生产初始化账号：
- 在 `.env` 设置 `INITIAL_ADMIN_*` / `INITIAL_OPERATOR_*`
- 运行 `pnpm prisma:seed` 创建初始账号（如果不存在则创建）

## 5) QWeather（最容易踩坑的点）

两种认证方式二选一：
- API Key：简单
- JWT/EdDSA：需要 `PUBLIC_ID` + `PROJECT_ID` + `PRIVATE_KEY_PEM`

常见报错：`error:1E08010C:DECODER routines::unsupported`
- 典型原因：`.env` 里的 PEM 私钥换行没有正确转成真实换行
- 本项目会把 `\\n` 和 `\n` 都替换成真实换行（见 `EnvService`）

## 6) OpenAPI vs Swagger（一句话）

- OpenAPI：接口“契约/规范”（JSON/YAML 的描述文件）
- Swagger：围绕 OpenAPI 的工具生态（UI、生成器、测试等）

## 7) 上线前你至少要补齐什么（最短清单）

- e2e 测试覆盖：register/login/refresh/logout + 1~2 个业务接口
- CORS 生产白名单（别用全放开）
- `enableShutdownHooks()` + 连接关闭策略（优雅停机）
- `/health` 健康检查（DB/Redis/第三方可选）
- 日志可观测：request-id/结构化日志（至少能排障）



