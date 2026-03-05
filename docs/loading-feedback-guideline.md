# Web 加载反馈规范（Admin）

## 目标

统一后台页面的加载感知，减少闪屏和全局遮罩带来的割裂感，同时保持布局稳定（`sider/header/main` 不受内容高度影响）。

## 反馈矩阵

| 场景 | 方式 |
| --- | --- |
| 首次加载 | Skeleton |
| 列表刷新 | Inline Loader |
| 提交操作 | Button Loading |
| 长任务 | Progress |
| 提示反馈 | Toast |
| 空数据 | Empty State |

## 组件约定

- `InitialSkeleton`：首屏数据骨架占位。
- `InlineLoader`：列表工具栏的轻量刷新状态提示。
- `AsyncButton`：提交按钮 loading 态，防止重复提交。
- `TaskProgressBanner`：长任务（导入/批量）进度反馈。

组件目录：

- `apps/web/src/ui/admin/components/feedback/`

## 页面实现约定

1. 列表页禁止使用整页遮罩作为默认刷新态。
2. `isInitialLoading` 只用于首屏骨架。
3. `isRefreshing` 只用于列表刷新提示（`InlineLoader` + 刷新按钮禁用）。
4. 提交类行为必须落在按钮内反馈（`AsyncButton`）。
5. 数据为空必须显示 `Empty` 组件，不显示空白区。

## 状态字段命名

推荐统一字段：

- `isInitialLoading`
- `isRefreshing`
- `isSubmitting`
- `progress`（仅长任务）

## 不符合规范的典型反例

1. 列表刷新时整页遮罩导致内容闪烁。
2. 提交操作无 loading 状态，用户重复点击触发多次请求。
3. 首屏空白无骨架导致“卡住”错觉。
