# Beginner Guide: 项目功能 + 全量 API + 从配置到启动

面向对象：**只会一点基础语法**、第一次接触后端/NestJS 的同学。  
目标：你照着做就能把项目跑起来，并且知道每个接口怎么用、怎么联调、哪里会踩坑。

---

## 0. 你先知道三件事（很重要）

1) **所有接口路径都有前缀**：`/api/v1`  
   例如登录接口实际是：`POST /api/v1/login`

2) **所有响应都统一成一种形状**（成功/失败都一样的外壳）：

```json
{
  "code": 0,
  "msg": "成功",
  "data": {}
}
```

- `code = 0` 表示成功
- `code != 0` 表示业务错误（参数错、未登录、第三方失败等）
- 发生业务错误时：项目约定一般仍返回 **HTTP 200**，错误通过 `code/msg` 表达

3) **Swagger 文档地址**（跑起来后打开这个就能看到接口）：

- Swagger UI：`http://localhost:8080/api/docs`

---

## 1. 项目主要功能（你能用它做什么）

### 1.1 用户与鉴权（Auth/User）

- 注册用户（username/password/email）
- 登录获取：
  - `token`（Access Token）：访问需要登录的接口时必须带上
  - `refreshToken`：当 `token` 过期，用它换新的 `token`
- 退出登录：
  - 会撤销 refresh token（数据库标记撤销）
  - 会把当前 access token 的 `jti` 拉入 Redis 黑名单（直到该 token 自然过期）
- 获取当前登录用户信息（`/user/me`）
- 分页查询用户列表、搜索用户

### 1.2 城市（City）

- 根据关键词搜索城市（会尝试从 DB 查；查不到则调用 QWeather 并异步写入 DB）
- 获取热门城市列表（调用 QWeather，带缓存）

### 1.3 空气质量（Air）

- 根据 `city_id` 获取实时 AQI
  - QWeather 调用失败时会尝试降级返回数据库里最近一次的记录
- 获取 hourly / daily 空气质量

### 1.4 通知/预警（Notice）

- 获取当前生效的通知/预警列表（active）
- 支持定时从 QWeather 同步预警（需要你在 `.env` 里开启定时任务配置）

### 1.5 Provider（需要登录）

- 获取 summary / stats（示例：第三方聚合类接口）

### 1.6 WebSocket

- 提供一个 WebSocket echo 示例：客户端发什么消息，服务端会把消息带上时间戳回显

---

## 2. 运行环境准备（第一次跑必看）

### 2.1 你需要安装什么

- Node.js 18+（建议）
- pnpm
- Docker Desktop（用于启动 Postgres + Redis）

### 2.2 启动数据库与 Redis（docker compose）

在项目根目录运行：

```bash
docker compose up -d
```

这会启动两个容器：

- Postgres：端口 `5432`
- Redis：端口 `6379`

如果你没装 Docker 或 Docker 没启动：

- 你会在后面 `pnpm prisma:migrate:dev` 或启动服务时遇到连接失败

---

## 3. 配置 `.env`（最容易踩坑）

### 3.1 创建 `.env`

在项目根目录运行：

```bash
cp apps/api/.env.example apps/api/.env
```

然后用编辑器打开 `.env` 修改里面的值。

> 注意：`.env` 已在 `.gitignore` 中忽略，不会被提交。真实密钥不要提交到仓库。

### 3.2 必须配置的环境变量（最低可运行集）

#### 3.2.1 PORT

```env
PORT=8080
```

如果启动报错 `EADDRINUSE :::8080`，说明 8080 被占用：

- 你可以改成 `PORT=8081` 再启动

#### 3.2.2 DATABASE_URL（Postgres 连接）

```env
DATABASE_URL=postgresql://postgres:123456@127.0.0.1:5432/go_practice_db?schema=public&sslmode=disable
```

说明：

- `postgres:123456` 来自 `docker-compose.yml` 默认配置
- `go_practice_db` 是数据库名（docker 启动时会创建）

#### 3.2.3 Redis

```env
REDIS_URL=redis://127.0.0.1:6379/0
```

#### 3.2.4 JWT（必须改成你自己的随机字符串）

```env
JWT_ACCESS_SECRET=replace-with-your-signing-key
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=go-practice
```

生成随机 secret（Windows PowerShell 兼容写法）：

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

运行两次，把两次输出分别填到：

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

> 如果你改了 secret：之前签发的 token 都会失效，需要重新登录。

### 3.3 QWeather 配置（City/Air/Notice 会用到）

你有两种方式二选一：

#### 方式 A：使用 API Key（更简单）

```env
QWEATHER_HOST=https://xxx.qweatherapi.com
QWEATHER_API_KEY=你的key
QWEATHER_PUBLIC_ID=
QWEATHER_PRIVATE_KEY_PEM=
```

#### 方式 B：使用 JWT（你目前配置的是这种）

```env
QWEATHER_HOST=https://nf5xmdy8n7.re.qweatherapi.com
QWEATHER_API_KEY=
QWEATHER_PUBLIC_ID=CHGUYCCGQR
QWEATHER_PROJECT_ID=3NKPCUCJRC
QWEATHER_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...你的私钥内容...\n-----END PRIVATE KEY-----\n"
```

非常重要：

- `.env` 里私钥建议用一行字符串，并用 `\n` 表示换行（dotenv 友好）
- 如果你看到类似错误：
  - `error:... DECODER routines::unsupported`
  通常就是私钥换行/转义格式不对导致的

### 3.4 定时任务（可选）

#### 3.4.1 热门城市缓存预热（City scheduler）

```env
CACHE_REFRESH_ENABLED=true
CACHE_REFRESH_SCHEDULE=0 */50 * * * *
CACHE_REFRESH_REGIONS_JSON=[{"name":"cn","count":20},{"name":"world","count":10}]
```

#### 3.4.2 预警同步（Notice scheduler）

```env
ALERT_SYNC_ENABLED=true
ALERT_SYNC_SCHEDULE=0 */30 * * * *
ALERT_SYNC_LOCATIONS_JSON=[{"name":"beijing","lat":"39.9042","lon":"116.4074"}]
```

---

## 4. 安装依赖与初始化数据库

### 4.1 安装依赖（pnpm）

```bash
pnpm install
```

注意：

- 你只能用 pnpm（项目规则要求）

### 4.2 生成 Prisma Client（非常重要）

```bash
pnpm prisma:generate
```

如果你编辑器里报 `PrismaService` 没有 `user/$transaction`，通常就是没生成或 VS Code 缓存没刷新：

- 先跑 `pnpm prisma:generate`
- VS Code 执行：`TypeScript: Restart TS Server`

### 4.3 迁移数据库（建表）

```bash
pnpm prisma:migrate:dev
```

这会根据 `prisma/schema.prisma` 建表（用户、refresh token、city、air、notice 等）。

### 4.4 初始化后台账号（可选，但生产推荐）

如果你需要后台的 `admin/operator` 账号，可以在 `.env` 配置：

- `INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD`
- `INITIAL_OPERATOR_USERNAME / INITIAL_OPERATOR_PASSWORD`

然后执行：

```bash
pnpm prisma:seed
```

---

## 5. 启动项目

### 5.1 开发模式（推荐）

```bash
pnpm dev:api
```

### 5.2 生产模式（了解即可）

```bash
pnpm build
pnpm start:prod
```

---

## 6. API 全量列表（按模块分组）

说明：

- Base URL：`http://localhost:8080`
- API Prefix：`/api/v1`
- 认证方式：需要登录的接口必须带 Header：
  - `Authorization: Bearer <token>`

### 6.1 Auth（认证）

#### 6.1.1 注册

- `POST /api/v1/register`
- Body(JSON)：
  - `username` string（必填）
  - `password` string（必填，>=6）
  - `email` string（可选，必须是 email 格式）

示例：

```bash
curl -X POST "http://localhost:8080/api/v1/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"alice\",\"password\":\"123456\",\"email\":\"alice@example.com\"}"
```

#### 6.1.2 登录

- `POST /api/v1/login`
- Body(JSON)：
  - `username` string（必填）
  - `password` string（必填）

返回 data（被统一响应包裹）：

- `token`：access token（请求私有接口用）
- `refreshToken`：刷新 token
- `user`：基本用户信息

示例：

```bash
curl -X POST "http://localhost:8080/api/v1/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"alice\",\"password\":\"123456\"}"
```

#### 6.1.3 刷新 token（新增）

- `POST /api/v1/refresh`
- Body(JSON)：
  - `refreshToken` string（必填）

示例：

```bash
curl -X POST "http://localhost:8080/api/v1/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"<your_refresh_token>\"}"
```

#### 6.1.4 退出登录

- `POST /api/v1/logout`
- Header：
  - `Authorization: Bearer <token>`

示例：

```bash
curl -X POST "http://localhost:8080/api/v1/logout" \
  -H "Authorization: Bearer <token>"
```

#### 6.1.5 Token 信息（调试）

- `GET /api/v1/user/token-info`
- Header：
  - `Authorization: Bearer <token>`

示例：

```bash
curl "http://localhost:8080/api/v1/user/token-info" \
  -H "Authorization: Bearer <token>"
```

### 6.2 User（需要登录）

#### 6.2.1 当前用户信息

- `GET /api/v1/user/me`
- Header：
  - `Authorization: Bearer <token>`

#### 6.2.2 用户列表（分页）

- `GET /api/v1/users`
- 权限：
  - 需要登录
  - 仅 `admin/operator` 可访问
- Header：
  - `Authorization: Bearer <token>`
- Query：
  - `page` number（默认 1）
  - `pageSize` number（默认 10，最大 100）

示例：

```bash
curl "http://localhost:8080/api/v1/users?page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

#### 6.2.3 搜索用户（分页）

- `GET /api/v1/users/search`
- 权限：
  - 需要登录
  - 仅 `admin/operator` 可访问
- Header：
  - `Authorization: Bearer <token>`
- Query：
  - `keyword` string（可选）
  - `page` number（默认 1）
  - `pageSize` number（默认 10）

示例：

```bash
curl "http://localhost:8080/api/v1/users/search?keyword=ali&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

#### 6.2.4 后台：禁用/启用用户

- `PATCH /api/v1/admin/users/:id/status`
- 权限：
  - 需要登录
  - 仅 `admin/operator` 可访问
- Body(JSON)：
  - `isActive` boolean（必填）

#### 6.2.5 后台：重置密码

- `POST /api/v1/admin/users/:id/reset-password`
- 权限：
  - 需要登录
  - 仅 `admin/operator` 可访问
- Body(JSON)：
  - `newPassword` string（必填，最少 6 位）

#### 6.2.6 后台：分配角色（权限分配）

- `PATCH /api/v1/admin/users/:id/role`
- 权限：
  - 需要登录
  - 仅 `admin` 可访问
- Body(JSON)：
  - `role`：`user|operator|admin`（必填）

### 6.3 City（公开）

#### 6.3.1 搜索城市

- `GET /api/v1/city/search`
- Query：
  - `keyword` string（必填）

示例：

```bash
curl "http://localhost:8080/api/v1/city/search?keyword=beijing"
```

#### 6.3.2 热门城市

- `GET /api/v1/city/top`
- Query：
  - `rangeType`：`world|cn|us`（可选，默认 world）
  - `number`：1~50（可选，默认 10）

示例：

```bash
curl "http://localhost:8080/api/v1/city/top?rangeType=world&number=10"
```

### 6.4 Air（公开）

#### 6.4.1 实时 AQI

- `GET /api/v1/air/now`
- Query：
  - `city_id` string（必填）

示例：

```bash
curl "http://localhost:8080/api/v1/air/now?city_id=101010100"
```

#### 6.4.2 Hourly AQI

- `GET /api/v1/air/hourly`
- Query：
  - `city_id` string（必填）

#### 6.4.3 Daily AQI

- `GET /api/v1/air/daily`
- Query：
  - `city_id` string（必填）

### 6.5 Notice（公开）

#### 6.5.1 当前生效通知

- `GET /api/v1/notice/active`

示例：

```bash
curl "http://localhost:8080/api/v1/notice/active"
```

#### 6.5.2 后台：公告配置（admin/operator）

- `GET /api/v1/admin/notices`
- `POST /api/v1/admin/notices`
- `PUT /api/v1/admin/notices/:id`
- `POST /api/v1/admin/notices/:id/publish`
- `POST /api/v1/admin/notices/:id/unpublish`

### 6.6 Provider（需要登录）

#### 6.6.1 Summary

- `GET /api/v1/provider/summary`
- Header：
  - `Authorization: Bearer <token>`

#### 6.6.2 Stats

- `GET /api/v1/provider/stats`
- Header：
  - `Authorization: Bearer <token>`

### 6.7 WebSocket

- WebSocket 路径：`ws://localhost:8080/api/v1/ws`

示例（浏览器控制台）：

```js
const ws = new WebSocket('ws://localhost:8080/api/v1/ws');
ws.onmessage = (e) => console.log('recv:', e.data);
ws.onopen = () => ws.send('hello');
```

---

## 7. 使用流程示例（从 0 到调用受保护接口）

### 步骤 1：注册

调用 `POST /api/v1/register` 创建一个账号。

### 步骤 2：登录获取 token

调用 `POST /api/v1/login` 得到：

- `token`
- `refreshToken`

### 步骤 3：访问需要登录的接口

例如用户列表：

```bash
curl "http://localhost:8080/api/v1/users?page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### 步骤 4：token 过期了怎么办

调用 `POST /api/v1/refresh`，用 `refreshToken` 换新的 token。

### 步骤 5：退出登录

调用 `POST /api/v1/logout`：

- refresh 会被撤销
- 当前 access token 也会因为 jti 黑名单而立即不可用

---

## 8. 常见问题与排查（小白也能照着做）

### 8.1 8080 端口被占用（EADDRINUSE）

症状：

- `EADDRINUSE :::8080`

解决：

- 改 `.env` 里的 `PORT`，或者找占用进程并停止：

```powershell
netstat -ano | findstr :8080
Get-Process -Id <PID>
Stop-Process -Id <PID> -Force
```

### 8.2 编辑器提示 PrismaService 没有 user/$transaction

解决：

```bash
pnpm prisma:generate
```

然后 VS Code：

- `TypeScript: Restart TS Server`

### 8.3 调用 city/top 报 OpenSSL DECODER unsupported

说明：这是 QWeather 私钥 PEM 的换行/转义格式问题。

解决：

- 检查 `.env` 中 `QWEATHER_PRIVATE_KEY_PEM` 是否使用 `\n` 表示换行
- 重新启动服务（`.env` 变更不会热加载）

---

## 9. 你应该优先用 Swagger 来看接口

运行项目后，打开：

- `http://localhost:8080/api/docs`

你可以：

- 看每个接口的路径/参数
- 直接点 “Try it out” 发请求
- 对比返回的 `{ code, msg, data }`
