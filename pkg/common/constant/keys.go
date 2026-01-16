package constant

// CtxKey 定义 Context Key 的专用类型，防止冲突
type CtxKey string

const (
	// ContextKeyUserID 用于在 Context 中存储用户 ID
	ContextKeyUserID CtxKey = "userID"
	// ContextKeyUsername 用于在 Context 中存储用户名
	ContextKeyUsername CtxKey = "username"
	// ContextKeyClaims 用于在 Context 中存储 JWT Claims
	ContextKeyClaims CtxKey = "claims"
)
