# 登录过期与会话闭环

本文只保留这条链路里的关键代码，方便快速定位。

## 1. 登录后发放双令牌

后端登录成功后签发 `accessToken + refreshToken`，并把 refresh token 落库。

文件：[auth.service.ts](/E:/wwt-study/projects/air-monitor/apps/api/src/modules/auth/auth.service.ts#L55)

```ts
private async issueTokens(user: { id: number; username: string; tokenVersion: number }): Promise<Tokens> {
  const accessToken = await this.jwt.signAsync(accessPayload, {
    secret: this.env.jwtAccessSecret,
    expiresIn: this.env.jwtAccessExpiresIn,
  });
  const refreshToken = await this.refreshJwt.signAsync(refreshPayload, {
    secret: this.env.jwtRefreshSecret,
    expiresIn: this.env.jwtRefreshExpiresIn,
  });

  await this.prisma.refreshToken.create({
    data: {
      userId: user.id,
      jti: refreshJti,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    },
  });
}
```

前端登录成功后把双令牌存到本地。

文件：[auth.ts](/E:/wwt-study/projects/air-monitor/apps/web/src/shared/auth.ts#L14)

```ts
export function setTokens(tokens: Tokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}
```

## 2. 请求阶段统一挂 access token

文件：[apply-auth-interceptor.ts](/E:/wwt-study/projects/air-monitor/apps/web/src/shared/http/apply-auth-interceptor.ts#L5)

```ts
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 3. 后端如何判定“登录已失效”

后端 JWT 校验不只看过期时间，还会看：
- token 是否被加入 Redis 黑名单
- 用户是否被删除/禁用
- `tokenVersion` 是否变化
- `tokenInvalidBefore` 是否命中

文件：[jwt.strategy.ts](/E:/wwt-study/projects/air-monitor/apps/api/src/modules/auth/jwt.strategy.ts#L32)

```ts
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: env.jwtAccessSecret,
});

const exists = await this.redis.get(`jwt:blacklist:jti:${payload.jti}`);
if (exists) throw new AppError(ErrorCodes.Unauthorized, '账号已退出登录');

if (payload.ver !== user.tokenVersion) {
  throw new AppError(ErrorCodes.Unauthorized, '登录已失效，请重新登录');
}
if (user.tokenInvalidBefore && payload.iat < invalidBeforeSec) {
  throw new AppError(ErrorCodes.Unauthorized, '登录已失效，请重新登录');
}
```

注意：当前后端异常过滤器会把鉴权失败包装成 `HTTP 200 + code=40100`。

文件：[http-exception.filter.ts](/E:/wwt-study/projects/air-monitor/apps/api/src/shared/http-exception.filter.ts#L22)

```ts
// Default: always return HTTP 200 with business error codes.
res.status(HttpStatus.OK).json({
  code,
  msg,
  data: {},
});
```

## 4. 前端闭环：40100/401 时自动 refresh 并重放原请求

入口文件：[api.ts](/E:/wwt-study/projects/air-monitor/apps/web/src/shared/api.ts#L16)

```ts
client.interceptors.response.use(
  async (response) => {
    if (shouldRefreshFromBusinessResponse(response)) {
      return retryRequestAfterRefresh(client, response.config);
    }
    const businessError = normalizeBusinessError(response.data);
    if (businessError) throw businessError;
    return response;
  },
  async (error: unknown) => {
    if (shouldRefreshFromTransportError(error)) {
      return retryRequestAfterRefresh(client, error.config);
    }
    const normalizedError = normalizeTransportError(error);
    reportUiError(normalizedError);
    return Promise.reject(normalizedError);
  },
);
```

refresh 逻辑本身集中在一个文件里，做了三件事：
- 单飞：并发过期时只发一次 `/refresh`
- 成功：覆盖本地双令牌
- 失败：清理会话并跳转登录页

文件：[auth-refresh.ts](/E:/wwt-study/projects/air-monitor/apps/web/src/shared/http/auth-refresh.ts#L64)

```ts
async function refreshAccessToken(): Promise<void> {
  const response = await refreshClient.post<ApiResponse<RefreshResponseData>>(
    '/refresh',
    { refreshToken },
    { _skipAuthRefresh: true } as RetryableRequestConfig,
  );

  if (response.data.code !== 0) {
    throw new ApiError(response.data.code, response.data.msg || '登录已过期，请重新登录');
  }

  setTokens({
    accessToken: response.data.data.accessToken,
    refreshToken: response.data.data.refreshToken,
  });
}

if (!refreshPromise) {
  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
}
```

重放原请求：

文件：[auth-refresh.ts](/E:/wwt-study/projects/air-monitor/apps/web/src/shared/http/auth-refresh.ts#L98)

```ts
await refreshAccessTokenOnce();
return api.request({
  ...config,
  _authRetry: true,
} as RetryableRequestConfig);
```

## 5. refresh 失败后的统一收口

文件：[auth-session.ts](/E:/wwt-study/projects/air-monitor/apps/web/src/shared/auth-session.ts#L8)

```ts
export function handleExpiredAuth(message = '登录已过期，请重新登录'): void {
  clearTokens();
  useAdminSessionStore.getState().clearSession();
  toast.error(message);
  window.location.replace('/admin/login');
}
```

这里做的是统一收口，而不是分散到每个页面里处理。

## 6. 后端 refresh 的安全语义

文件：[auth.service.ts](/E:/wwt-study/projects/air-monitor/apps/api/src/modules/auth/auth.service.ts#L123)

```ts
payload = await this.refreshJwt.verifyAsync(refreshToken, {
  secret: this.env.jwtRefreshSecret,
});

if (stored.tokenHash !== sha256(refreshToken)) {
  await this.prisma.refreshToken.updateMany({
    where: { userId: payload.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  throw new AppError(ErrorCodes.Unauthorized, '检测到 Refresh Token 复用');
}

await this.prisma.refreshToken.update({
  where: { id: stored.id },
  data: { revokedAt: new Date() },
});

return this.issueTokens({ ... });
```

语义很明确：
- refresh token 要验签
- 要命中数据库里的当前 token 记录
- 要没撤销、没过期
- 要通过 `tokenVersion` / `tokenInvalidBefore`
- 用过一次就轮换
- 检测到复用时，直接撤销该用户全部 refresh token

## 7. 哪些后台操作会让现有登录立即失效

文件：[user.service.ts](/E:/wwt-study/projects/air-monitor/apps/api/src/modules/user/user.service.ts#L216)

```ts
await this.repo.updateStatus(id, isActive, now);
await this.repo.revokeAllRefreshTokens(id, now);

await this.repo.updatePassword(id, passwordHash, now);
await this.repo.revokeAllRefreshTokens(id, now);

await this.repo.updateRole(id, role, now);
await this.repo.revokeAllRefreshTokens(id, now);
```

也就是说，以下操作会让当前会话后续全部失效：
- 禁用用户
- 重置密码
- 修改角色

## 8. 实际运行顺序

```text
登录
  -> 后端签发 accessToken + refreshToken
  -> 前端保存到 localStorage

业务请求
  -> 自动带 accessToken
  -> accessToken 有效: 正常返回
  -> accessToken 失效: 前端统一触发 /refresh

/refresh 成功
  -> 覆盖本地双令牌
  -> 重放原请求

/refresh 失败
  -> 清 accessToken / refreshToken / admin-session
  -> toast 提示
  -> 跳转 /admin/login
```

## 9. 当前边界

- `40100 + 权限不足` 不会触发 refresh，只按普通鉴权失败处理。
- 路由守卫仍然只检查本地是否有 token；真正的“续期或退出”发生在首次受保护请求时。
- 后端当前 access token 过期时间以 `apps/api/.env` 为准，当前仓库配置为 `24h`，refresh token 为 `7d`。
