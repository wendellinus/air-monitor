# Air Monitor Monorepo

空气质量监测项目的 monorepo，包含：

- `apps/api`：NestJS API
- `apps/web`：React + Vite 前端，包含大屏和后台管理界面
- `packages/shared`：前后端共享类型与工具

如果你是第一次接手这个项目，建议直接按下面的“5 分钟启动”步骤操作。

## 项目结构

```text
air-monitor/
├─ apps/
│  ├─ api/         # NestJS 后端
│  └─ web/         # React + Vite 前端
├─ packages/
│  └─ shared/      # 共享包
├─ docs/           # 项目说明文档
├─ docker-compose.yml
├─ package.json
└─ pnpm-workspace.yaml
```

## 环境要求

推荐使用下面这套环境：

- Node.js `20 LTS`（`18+` 也可运行）
- `pnpm`
- Docker Desktop（推荐，用来启动 Postgres 和 Redis）

你也可以不使用 Docker，改为手动安装：

- PostgreSQL `16+`
- Redis `7+`

## 5 分钟启动

以下命令都在仓库根目录执行。

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动数据库和 Redis

推荐直接使用仓库自带的 Docker Compose：

```bash
pnpm dev:infra
```

默认会启动：

- Postgres：`127.0.0.1:5432`
- Redis：`127.0.0.1:6379`

如果你想确认容器是否启动成功：

```bash
docker compose ps
```

### 3. 配置后端环境变量

复制环境变量模板：

```bash
cp apps/api/.env.example apps/api/.env
```

Windows PowerShell 也可以这样复制：

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

然后编辑 `apps/api/.env`，至少确认下面这些配置：

```env
PORT=8080
DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/air_monitor?schema=public&sslmode=disable
REDIS_URL=redis://127.0.0.1:6379/0

JWT_ACCESS_SECRET=dev-access-secret-please-change
JWT_REFRESH_SECRET=dev-refresh-secret-please-change

INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=Admin@123456
INITIAL_OPERATOR_USERNAME=operator
INITIAL_OPERATOR_PASSWORD=Operator@123456

CACHE_REFRESH_ENABLED=false
ALERT_SYNC_ENABLED=false
PROVIDER_ACCOUNT_SYNC_ENABLED=false
```

说明：

- `JWT_ACCESS_SECRET` 和 `JWT_REFRESH_SECRET` 必须至少 16 个字符，否则 API 启动会失败。
- `INITIAL_ADMIN_*` / `INITIAL_OPERATOR_*` 用于初始化后台账号。
- 第一次本地启动建议把 3 个定时任务都关掉，避免因为第三方服务未配置而反复打印告警日志。

### 4. 初始化数据库

先执行 Prisma 迁移：

```bash
pnpm prisma:migrate:dev
```

再执行种子数据，创建初始后台账号：

```bash
pnpm prisma:seed
```

说明：

- `pnpm run setup` 目前只会执行数据库迁移。
- 为了确保管理员账号一定被创建，第一次启动时建议手动再执行一次 `pnpm prisma:seed`。

### 5. 启动前后端

```bash
pnpm dev
```

启动后默认访问地址：

- 前端大屏：`http://localhost:5173/screen`
- 后台登录页：`http://localhost:5173/admin/login`
- Swagger 文档：`http://localhost:8080/api/docs`
- API 前缀：`/api/v1`

后台登录账号就是你在 `apps/api/.env` 里配置的：

- 管理员：`INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_PASSWORD`
- 运维账号：`INITIAL_OPERATOR_USERNAME` / `INITIAL_OPERATOR_PASSWORD`

## 前端地图配置（可选）

如果你需要正常使用大屏地图组件，再配置前端环境变量：

```bash
cp apps/web/.env.example apps/web/.env
```

然后编辑 `apps/web/.env`：

```env
VITE_AMAP_KEY=你的高德 Web JS API Key
VITE_AMAP_SECURITY_JS_CODE=你的高德安全密钥
```

说明：

- 不配置高德 Key，前端依然可以启动。
- 但 `/screen` 页面里的地图部件会提示未配置，无法正常展示地图。

## 第三方服务说明

项目里有一部分功能依赖第三方数据服务：

- 和风天气 / 空气质量接口
- 高德地图 JS API
- 提供商额度监控相关接口

如果你还没有配置这些凭证：

- 项目仍然可以启动；
- 登录、权限、用户、公告、后台基础页面等本地功能可以正常使用；
- 城市检索、空气质量、天气告警、部分统计/额度能力可能会因为第三方未配置而返回错误或空数据。

所以对新手来说，建议先完成“项目能跑起来 + 能登录后台”，再补第三方配置。

## 常用命令

### 根目录命令

```bash
pnpm dev                # 同时启动 API 和 Web
pnpm dev:api            # 只启动 API
pnpm dev:web            # 只启动 Web
pnpm dev:infra          # 启动 Postgres + Redis
pnpm dev:infra:down     # 停止基础设施容器

pnpm build              # 构建整个 workspace
pnpm build:api          # 构建 API
pnpm build:web          # 构建 Web

pnpm test               # API 单测
pnpm test:e2e           # API e2e

pnpm prisma:migrate:dev # 执行数据库迁移
pnpm prisma:seed        # 初始化种子数据
pnpm prisma:studio      # 打开 Prisma Studio
```

## 新手最常见问题

### 1. `pnpm dev` 后 API 起不来

优先检查：

- `apps/api/.env` 是否存在
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` 是否至少 16 位
- Postgres 和 Redis 是否已经启动

### 2. 数据库连接失败

先确认容器是否正常：

```bash
docker compose ps
```

默认数据库连接串是：

```env
DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/air_monitor?schema=public&sslmode=disable
```

如果你本地数据库用户名、密码或端口不一致，请同步修改 `apps/api/.env`。

### 3. 能打开前端，但后台账号登录失败

重新执行一遍种子数据：

```bash
pnpm prisma:seed
```

然后使用 `apps/api/.env` 中的初始账号登录。

### 4. `/screen` 页面地图为空

这是因为没有配置 `apps/web/.env` 中的高德 Key。前端能启动是正常的，但地图组件不会正常工作。

### 5. 改了 API 端口后，前端请求失败

前端开发代理默认写在 `apps/web/vite.config.ts`，指向的是：

```ts
'/api': 'http://localhost:8080'
```

如果你修改了 `apps/api/.env` 里的 `PORT`，记得同步调整 `apps/web/vite.config.ts`。

## 相关文档

- API 新手说明：`apps/api/docs/beginner-guide.md`
- API 记忆锚点：`apps/api/docs/memory-anchor.md`
- 大屏布局说明：`docs/screen-page-layout.md`

## 开发约定

- 包管理器统一使用 `pnpm`
- API 路径前缀保持为 `/api/v1`
- API 响应格式保持为 `{ code, msg, data }`

