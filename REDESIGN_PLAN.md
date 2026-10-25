# CIM Manager 重新规划方案

> 基于 test1 分支全量代码评审（2026-10-25），前端 13 页面 / 8233 行，后端 FastAPI 12 组路由。

---

## 一、现状评审结论

### 1.1 三个真 Bug（优先修）

| # | 问题 | 位置 |
|---|------|------|
| 1 | "查看机台详情"路由未注册，点击后整页空白 | `App.tsx` 定义了 `/equipment/:equipmentName` 标题但 `<Routes>` 无此路由 |
| 2 | 侧栏收起后内容区仍写死 `ml-64`，左侧留 256px 空洞 | `App.tsx:48`、`Sidebar.tsx:47-49` |
| 3 | 表格导入成功计数恒为 undefined（提示残缺"成功导入 个工作项"） | `WorkItems.tsx:173`，count 在 `res.data.count` |

### 1.2 "乱"的根源（按严重度排序）

1. **明暗主题混用**：Modal 组件整体是暗色（`Modal.tsx:46` `bg-dark-900`），但所有弹窗内容按亮色设计；WeeklyReport 整页残留 dark 类。是"全暗色→改亮色"改了一半的化石。
2. **26 处重复的颜色/文案映射函数**：`getStatusColor/getPriorityColor/getStatusLabel...` 散落在 9 个文件，且彼此不一致（同一"开发中"状态在列表页是 blue、详情页是 cyan）。
3. **一套应用四种统计卡、七种空状态、六种骨架屏、三处手写表格**：无 Table/Badge/EmptyState/Skeleton/Toast 基础组件，每页各画一套。
4. **页面双标题**：Header 已有标题，WorkItems/AIAssistant/ProjectDetail/RequirementDetail 页内又画一遍大标题；页边距两档（套 `p-6` 的 48px vs 不套的 24px）。
5. **数据层三种模式并存**：页面 useState / zustand 双写 / 完全不经 store；错误处理有 alert、console.error、静默换假数据三种；所有搜索都是前端过滤（WorkItems 只滤当前已加载的 200 条）；机台页全量拉 1000 条只为渲染下拉框。
6. **假功能与 mock 兜底**：Dashboard"AI智能提示"是硬编码句子；WeeklyReport API 失败静默展示假周报、AI 生成失败填假内容；RequirementDetail 变更记录不持久化刷新即丢；Profile 全是假开关死按钮；Header 搜索是 `alert()`、通知写死；Login 页留有开发后门快捷用户列表。

### 1.3 信息架构问题

- **工作管理（工作项）/ 项目管理（任务）/ 需求管理** 三个实体边界模糊，都是"列表+筛选+弹窗 CRUD"的同质页面。
- **AI规划助手** 独立成页塞 5 个 Tab，但 AI 能力本应内联在各业务页（排序、生成周报、对话），独立页面利用率低。
- **机台管理** 是只读参考数据，却占一级导航与"项目/需求"并列。
- **用户管理 / 系统设置 / 个人资料** 三处分散的管理功能应收敛。

---

## 二、主流参考案例

### 直接可用（技术栈同构：React + Vite + Tailwind + TS）

| 项目 | 地址 | 参考点 |
|------|------|--------|
| **shadcn/ui** | https://ui.shadcn.com | 组件复制进项目可完全定制，Radix 无障碍交互，本次重构组件层首选 |
| **shadcn-admin (Satnaing)** | https://github.com/satnaing/shadcn-admin | 最贴合本项目的整体布局参考：侧栏分组导航、任务管理页（看板+表格双视图）、设置中心（多 Tab 合并用户/账户/通知）、命令面板 ⌘K |
| **Tremor** | https://github.com/tremorlabs/tremor | 仪表盘图表组件（进度环、条形图、趋势卡），替代 CSS 手绘条形图 |
| **Origin UI** | https://originui.com | 200+ Tailwind 表单/筛选/空状态 blocks，可直接抄样式 |
| **cmdk** | https://github.com/pacocoursey/cmdk | ⌘K 命令面板实现（Linear 同款交互） |
| **gantt-task-react** | https://github.com/MaTeZu/gantt-task-react | ProjectDetail 手绘甘特图的替代方案 |
| **TanStack Table** | https://github.com/TanStack/table | 机台 14 列大表 + 排序/筛选/虚拟化 |
| **sonner** | https://github.com/emilkowalski/sonner | Toast 通知，替换全部 alert/confirm |

### 交互/视觉风格参考

| 产品 | 学什么 |
|------|--------|
| **Linear** (linear.app) | 紧凑密度、灰阶层次、状态色克制、⌘K 全局搜索、列表行 hover 才浮现操作按钮 |
| **Notion** | 侧栏分组 + 数据库多视图切换（表格/看板/日历同一份数据） |
| **ClickUp** | 仪表盘 widget 化、多状态分组 |
| **Todoist** | "今日/收件箱"优先的日常任务流，四象限优先级 |

### 灵感图库

- Dribbble: [Task Management UI](https://dribbble.com/tags/task-management-ui-design) / [project-dashboard](https://dribbble.com/search/project-dashboard)
- 中文生态可参考 **Ant Design Pro** 的 ProTable/ProLayout 模式（仅参考布局思路，不必引入依赖）

---

## 三、重新规划

### 3.1 设计系统（一次建好，处处复用）

**引入 shadcn/ui**（把组件源码复制进 `src/components/ui/`，与现有 Tailwind 无冲突），配套：

```
src/
├── components/
│   ├── ui/            ← shadcn 基件: button badge card dialog table tabs
│   │                    select dropdown-menu toast skeleton tooltip command
│   ├── layout/        ← AppShell(侧栏+单一页头, 修 collapse bug)
│   └── biz/           ← 业务复用件: StatusBadge PriorityBadge DataTable
│                        PageHeader FilterToolbar EmptyState ConfirmDialog
├── constants/
│   └── status.ts      ← 全项目唯一的 状态/优先级→颜色+中文 映射（删 26 处重复）
├── hooks/             ← useList(分页+筛选+刷新) useConfirm
```

- **主题**：亮色为主（维持现状），shadcn 原生支持后续加暗色开关；主色收敛为一套 cyan，删 `primary`/`dark-*` 残留。
- **反馈**：sonner toast 替换全部 alert/confirm；删除所有 mock 兜底，失败必须可见。

### 3.2 信息架构：9 项 → 分组 7 项

```
总览   仪表盘（今日工作台）
执行   工作台（原"工作管理"，统一收件箱）
       项目
       需求
数据   机台（只读基础数据）
智能   AI 助手（全局 ⌘K 入口 + 内联按钮，不再是独立 Tab 页）
产出   周报
管理   设置中心（合并：通用 / AI / Notes / 成员(原用户管理) / 账户(原个人资料)）
```

- 用户管理、个人资料并入设置中心（参考 shadcn-admin 的 settings 布局），侧栏少两项。
- AI 的 5 个 Tab 拆解：每日站会/智能排序/提醒检查 → 内联到工作台页顶按钮；AI 对话 → ⌘K 命令面板或右下角浮动球；工作规划 → 需求/项目详情页内按钮。侧栏"AI规划助手"一级入口取消。

### 3.3 页面级规划

| 页面 | 重构要点 |
|------|---------|
| **仪表盘** | 定位改为"今日工作台"：今日待办 checklist（可勾选）+ 四象限概览 + 近期截止 + 需求动态。删假 AI 卡；类别分布换 Tremor 条形图；保留 60s 轮询但改用统一 useList |
| **工作台** | Linear 风格紧凑列表 + 看板双视图（按状态拖拽分组）；类别侧栏保留；搜索改服务端；批量选择操作；行 hover 浮现操作 |
| **项目** | 列表页保留卡片网格；详情页甘特图换 gantt-task-react，任务按状态分组，可从需求一键转项目任务 |
| **需求** | 看板为主视图（状态列拖拽），四象限为第二视图；象限 JSX 由 4 段复制粘贴改为 `quadrantConfig.map`；详情页变更记录真持久化（后端加一张 change_log 表或复用 logs 接口） |
| **机台** | TanStack Table + 分页/虚拟滚动（不再全量 1000 条）；列可配置显隐；保留 Git Source 配置；补上机台详情路由或去掉该按钮 |
| **周报** | 一条流：AI 生成 → 编辑 → 预览 → 导出（补真导出）；删 mock 兜底；dark 类全清 |
| **设置中心** | 左侧分组导航：通用 / AI 配置 / Notes / 成员 / 账户安全；Profile 的假开关要么接真接口要么删除 |
| **全局** | ⌘K 命令面板（cmdk）：搜工作项/需求/项目 + 快捷动作；Header 通知接真数据或先删掉 |

### 3.4 数据层统一

- 二选一：**推荐"轻 store"方案** —— appStore 只留 UI 状态（侧栏、主题），列表数据由 `useList` hook 管理（分页+筛选+防抖搜索+刷新+错误 toast），authStore 并入 axios 拦截器。
- 所有搜索改服务端（后端已支持 keyword 参数，前端从未用过）；分页真实启用，机台页不再拉 1000 条。
- 详情页一律 `xxxAPI.get(id)`，禁止"全量拉回再 find"。
- 错误统一约定：toast 提示 + console.error，禁止静默。

### 3.5 分阶段实施（建议顺序）

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| **P0 止血** | 修 3 个真 bug；删 Login 后门、Header 假通知、全部 mock 兜底；Modal/WeeklyReport 暗色残留清掉 | 0.5 天 |
| **P1 基建** | shadcn/ui 初始化 + 10 个基件 + `constants/status.ts` 唯一映射 + toast 替换 confirm/alert | 1~2 天 |
| **P2 壳** | AppShell 布局（修 collapse）、侧栏分组导航、单页头模式、设置中心合并 | 1 天 |
| **P3 页面** | 按使用频率逐页重构：工作台 → 需求 → 仪表盘 → 项目 → 周报 → 机台 | 每页 0.5~1 天 |
| **P4 数据层** | useList 统一、服务端搜索/分页、AI 内联化 + ⌘K | 1~2 天 |

每阶段结束提交一次，前端功能不变坏（旧接口全保留，只是调用方式统一）。

---

## 四、评审明细索引

完整问题清单（含 file:line）已在评审中覆盖，关键索引：

- 颜色映射 26 处重复：Dashboard/Projects/ProjectDetail/Equipment/Requirements/RequirementDetail/Users/WorkItems/AIAssistant
- 四象限 4 段复制 JSX：`Requirements.tsx:389-551`
- CSV 导出两份重复：`WorkItems.tsx:210-235`、`Equipment.tsx:116-129`
- 12 个从未调用的 api.ts 方法与 60% 死 store：`src/stores/appStore.ts`
- 18 处 `(item as any)`：`Equipment.tsx`（根因：types 里 Equipment 新旧双字段并存）
