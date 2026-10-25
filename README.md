# CIM Manager

半导体 CIM EAP 工程师的个人工作管理系统：工作项、项目、需求、机台、周报一站式管理，内置 AI 规划能力与双主题 UI。

## 功能总览

### 总览
- **仪表盘（今日工作台）**：问候语 + 待办数、全局统计卡、今日待办（可勾选完成）、近期截止（逾期标红）、需求动态、项目进度、快捷入口

### 执行
- **工作台**：Linear 风格紧凑列表，勾选完成、行 hover 操作、类别侧栏、Excel 表格导入/CSV 导出、**AI 智能排序**（优先级 / 截止日期 / 类别三种策略，`ai/smart-sort`）
- **项目**：卡片网格 + 状态筛选，项目详情含任务分组、进度环、时间线甘特图
- **需求**：**看板视图（支持拖拽换列，乐观更新）** + 四象限视图双模式；**变更记录持久化**——状态/优先级等字段变更自动写入日志，也可手动添加记录（含文件路径）

### 数据
- **机台**：只读直连量产表 `PANJOB.EQUIPMENTINFO`，服务端关键字/类型筛选 + 分页（每页 50）、状态统计条、CSV 导出、**Git Source 配置**（Type|Model → Git 子路径映射，跳转源码）

### 产出
- **周报**：AI 生成 → 编辑 → 预览 → 导出 Markdown 一条流

### 智能
- **AI 规划助手**：每日站会 / 智能排序 / 提醒检查 / 工作规划 / AI 对话
- **全局提醒**：Header 铃铛展示真实逾期与高优先级提醒（`ai/check-reminders`）
- AI 对话/生成失败时**诚实报错**（提示去设置页配置），绝不伪造回复

### 全局能力
- **⌘K / Ctrl+K 命令面板**：搜索页面、工作项、需求、项目 + 快捷动作（新建工作项、创建需求、导入表格、生成周报、切换主题）
- **双主题**：经典（浅色侧栏 + 青色）/ 现代（深色侧栏 + 靛蓝），侧栏底部或 Header 太阳/月亮按钮切换，localStorage 记忆
- **设置中心**：通用 / AI 配置 / Notes / 成员 / 账户 五区合一
- Toast 通知 + Promise 风格确认弹窗，杜绝原生 alert/confirm

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + TypeScript + Tailwind CSS + zustand + react-router |
| 后端 | FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| 数据库 | 本地 SQLite（零配置开发）/ Oracle 量产（PANJOB 只读直连） |
| AI | OpenAI 兼容 API（未配置时自动降级本地算法） |

## 目录结构

```
web/
├── src/
│   ├── components/        # 布局与业务组件（Sidebar/Header/CommandPalette/Modal）
│   │   └── ui/            # 基础组件（Badge/Toast/ConfirmDialog/EmptyState/Skeleton）
│   ├── constants/status.ts  # 全项目唯一的状态→颜色/文案映射
│   ├── hooks/             # useClickOutside / useList(防抖搜索+分页)
│   ├── pages/             # 12 个页面
│   ├── services/api.ts    # axios 封装（拦截器统一 token/401/错误解包）
│   └── stores/            # zustand（UI 状态 + 主题持久化）
└── backend/
    ├── routes/            # 12 组 REST 路由
    ├── services/          # 业务逻辑（变更自动记录、优先级算法、AI 降级）
    ├── database/          # 模型与会话（create_all 自动建表）
    └── config/            # 数据库/AI/Notes 配置
```

## 快速开始（本地 SQLite 模式，无需 DBA）

```bash
# 前端
npm install
npm run dev          # 默认 http://localhost:5173

# 后端（新终端）
cd backend
pip install -r requirements.txt
python run.py        # http://localhost:8000，SQLite 自动建表+种子数据
```

登录：进入页面自动尝试 Windows 域 SSO；也可手动输入用户名（内置 `administrator` / `eap.engineer` / `cim.user`）。

### 量产 Oracle 模式
见 [DEPLOY_ORACLE_SOP.md](./DEPLOY_ORACLE_SOP.md)（PANJOB 账号 GRANT 授权 + init_oracle.sql 初始化）。

## 设计要点

- **主题系统**：主色由 CSS 变量驱动（`--accent-*`），`html.theme-classic` 一键切换整套色板，新增主题只需加一组变量
- **状态色唯一来源**：`src/constants/status.ts`，页面禁止本地定义颜色映射
- **数据层**：列表统一走 `useList` hook（防抖搜索 + 分页 + 错误 toast），禁止 mock 兜底
- **审计**：需求字段变更自动写 `change_records`；工作项创建/更新/状态变更/删除写 `work_logs`

## API 概览

- `POST /api/ai/*`：plan / optimize / weekly-report / daily-standup / smart-sort / check-reminders
- `GET|POST /api/requirements/{id}/changes`：需求变更记录（字段变更自动写入）
- `GET /api/work/items?keyword=`：工作项关键字搜索（title/details）
- `GET /api/equipment?keyword=&equipment_type=&page=&limit=`：机台服务端搜索分页
- 其余 CRUD：projects / requirements / work categories & items / reports / users / notes / settings

## 许可证

MIT License
