# CIM Work Manager

半导体CIM EAP工程师工作管理平台，集成AI智能规划功能。

## 功能特性

### 项目管理
- 项目创建、编辑、归档、删除
- 甘特图任务时间线可视化
- 里程碑追踪
- 项目详情查看

### 机台管理
- Oracle生产数据库对接（只读模式）
- 机台列表展示与筛选
- CSV导出功能
- 设备状态与配置管理

### 需求管理
- 四象限优先级视图（紧急/重要矩阵）
- 看板视图与四象限切换
- 状态流转图
- 变更记录追踪

### AI助手
- 智能工作规划建议
- 任务优化
- 周报自动生成

### 周报管理
- 周报生成
- 历史周报查看

### 认证系统
- Windows域认证SSO（单点登录）
- JWT令牌管理
- 手动用户名登录（备用方案）

## 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS 3
- Vite 5
- React Router DOM 6
- Zustand（状态管理）
- Lucide React（图标）

### 后端
- FastAPI
- SQLAlchemy ORM
- PyJWT
- Oracle DB（生产）/ SQLite（开发）
- Uvicorn

## 环境要求

- Python 3.11+
- Node.js 18+
- npm 9+

## 安装与运行

### 前端安装

```bash
npm install
```

### 后端安装

```bash
cd backend
pip install -r requirements.txt
```

### 开发模式

启动后端服务（端口 8000）：

```bash
cd backend
python run.py
```

启动前端开发服务器（端口 5173）：

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 配置说明

### 后端配置

编辑 `backend/.env` 文件：

```env
# 数据库类型: sqlite 或 oracle
database_type=sqlite

# SQLite配置
sqlite_url=./data/example_db.sqlite

# Oracle配置（生产环境）
oracle_user=your_username
oracle_password=your_password
oracle_dsn=your_oracle_dsn

# OpenAI API（AI助手功能）
openai_api_key=your_api_key
openai_api_base=https://api.openai.com/v1
```

### Windows认证

系统默认使用Windows域认证SSO，后端读取当前登录用户信息。如需添加新用户，编辑 `backend/services/auth_service.py` 中的 `KNOWN_USERS` 字典。

## 项目结构

```
├── backend/                 # 后端代码
│   ├── config/             # 配置文件
│   ├── database/           # 数据库模型与连接
│   ├── routes/             # API路由
│   ├── schemas/            # Pydantic模型
│   ├── services/           # 业务逻辑服务
│   ├── main.py             # FastAPI入口
│   └── run.py              # 启动脚本
├── src/                    # 前端代码
│   ├── components/         # UI组件
│   ├── pages/              # 页面组件
│   ├── services/           # API服务
│   ├── stores/             # Zustand状态管理
│   ├── types/              # TypeScript类型定义
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # React渲染入口
├── index.html              # HTML模板
├── package.json            # 前端依赖
├── vite.config.ts          # Vite配置
└── tailwind.config.js      # Tailwind配置
```

## API接口

### 认证接口
- `GET /api/auth/windows` - Windows SSO登录
- `POST /api/auth/login` - 手动登录
- `GET /api/auth/verify` - Token验证

### 项目接口
- `GET /api/projects` - 项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/{id}` - 项目详情
- `PUT /api/projects/{id}` - 更新项目
- `DELETE /api/projects/{id}` - 删除项目

### 机台接口
- `GET /api/equipment` - 机台列表
- `GET /api/equipment/{id}` - 机台详情

### 需求接口
- `GET /api/requirements` - 需求列表
- `POST /api/requirements` - 创建需求
- `GET /api/requirements/{id}` - 需求详情

### AI接口
- `POST /api/ai/plan` - 智能规划
- `POST /api/ai/optimize` - 任务优化
- `POST /api/ai/weekly-report` - 周报生成

## 许可证

MIT License