# CIM Work Manager Oracle 生产环境部署 SOP

> **适用版本**: v1.5.x（PANJOB 直连版，显式 SEQUENCE+TRIGGER，需 DBA 一行 GRANT）
> **适用场景**: 新服务器部署本项目，连接 **Oracle 生产数据库**，用 **PANJOB 账号直连**，在 `PANJOB.EQUIPMENTINFO` 所在表空间创建业务表，前端直接读取展示量产机台数据
> **预估耗时**: 约 15 分钟（DBA 一行授权 + 单步 SQL 部署）
> **执行角色**: 应用运维（PANJOB 账号持有人）+ DBA（仅一次 GRANT）
> **代码分支**: test1

---

## 目 录

1. [方案核心说明](#0-方案核心说明)
2. [部署前置条件](#1-部署前置条件)
   - 1.1 账号与权限
   - 1.2 验证 PANJOB 账号可用
   - 1.3 DBA 一次性授权（关键前置步骤）
3. [单步 SQL 部署：init_oracle.sql](#2-单步-sql-部署init_oraclesql)
4. [后端 Oracle 连接配置（.env）](#3-后端-oracle-连接配置env)
5. [代码部署与启动验证](#4-代码部署与启动验证)
6. [EQUIPMENTINFO 字段映射总览](#5-equipmentinfo-字段映射总览)
7. [Git Source (SOURCECODE) 对接说明](#6-git-source-sourcecode-对接说明)
8. [故障排查 FAQ](#7-故障排查-faq)
9. [附录：业务表一览](#8-附录业务表一览)

---

## 0. 方案核心说明

> **先回答最关键的问题：机台管理的数据从哪里来？**

**直接读取 PANJOB.EQUIPMENTINFO 量产真表，不建视图、不建中间表、不复制数据。**

| 项 | 说明 |
|----|------|
| 登录账号 | **PANJOB**（与 EQUIPMENTINFO 同账号，无需 DBA 额外授权） |
| EQUIPMENTINFO | **生产真表，已存在且为量产数据**，本 SOP 绝不 CREATE/DROP/INSERT/UPDATE 它 |
| 新建业务表位置 | **PANJOB 默认表空间 = EQUIPMENTINFO 所在表空间**（CREATE TABLE 不指定 TABLESPACE，自动落到 PANJOB 默认表空间） |
| 后端 ORM | `Equipment.__tablename__ = "EQUIPMENTINFO"`，直接映射 18 列真表 |
| 读取方式 | SQLAlchemy 只读 SELECT，**后端不提供 POST/PUT/DELETE 写操作路由** |
| 状态字段 | EQUIPMENTINFO 无 `STATUS` 列，由 `OS` 字段派生：含 `Win` → online，NULL → offline，其他 → maintenance |
| 自增列 | **显式 CREATE SEQUENCE + CREATE TRIGGER**（共 13 对，显式 SQL，**需要 DBA 一行 GRANT 授权**，详见 1.3 节） |
| 机台类型下拉 | 前端从机台列表前端去重，后端 `/api/equipment/types` 直接查 EQUIPMENTINFO 去重，**无 EQUIPMENT_TYPES 视图** |
| EQUIPMENT_NAME 关联 | **不建外键**（生产表 EQUIPMENT 列无 PK/UNIQUE 约束，建 FK 会报 ORA-02270），只建普通索引，后端应用层校验存在性 |
| DBA 介入 | **仅一次 GRANT**（`GRANT CREATE SEQUENCE, CREATE TRIGGER TO PANJOB;`），永久生效，详见 1.3 节 |

**v1.4 相对 v1.3 的修正（针对 ADS 实际执行报错）：**

| v1.3 问题 | v1.4 修正 |
|-----------|-----------|
| `FOREIGN KEY ... REFERENCES EQUIPMENTINFO(EQUIPMENT)` 报 **ORA-02270** (CONFIGURATIONS / REQUIREMENTS) | 生产表 EQUIPMENTINFO.EQUIPMENT 列没有 PK 或 UNIQUE 约束，Oracle 不允许建外键 → **去掉外键**，EQUIPMENT_NAME 只建普通索引，后端应用层校验存在性 |
| PL/SQL 循环 `EXECUTE IMMEDIATE 'CREATE SEQUENCE ...'` 报 **ORA-01031 权限不足** (line 17) | PANJOB 的 CREATE SEQUENCE/TRIGGER 权限通过 ROLE 授予，**PL/SQL 块内 DDL 需要 DIRECT GRANT** → 改为 **13 对显式 CREATE SEQUENCE / CREATE TRIGGER SQL**，显式 SQL 通过 ROLE 即可执行 |
| `CREATE INDEX IDX_USERS_USERNAME` 等报 **ORA-01408 此列列表已索引** (3 处) | 表定义已有 `UNIQUE (USERNAME)` 等约束自动建索引，再 CREATE INDEX 重复 → **去掉 3 个冗余索引**（IDX_USERS_USERNAME / IDX_SYS_SETTINGS_KEY / IDX_WORK_CATEGORIES_CODE） |

**与更早方案对比（已废弃）：**

| 旧方案 | v1.4 (本 SOP) |
|-------|---------------|
| 用 CIM_WEB_USER 独立账号 | **用 PANJOB 账号直连** |
| 建 EQUIPMENT 占位表 + 视图映射 | **不建 EQUIPMENT 表，ORM 直接映射真表** |
| 需要 DBA GRANT SELECT / CREATE VIEW | **不需要 DBA 介入** |
| v1.3 建 FK 指向 EQUIPMENTINFO + PL/SQL 循环建 SEQ/TRG | **v1.4 去掉 FK，改显式 SQL 建 SEQ/TRG** |

---

## 1. 部署前置条件

### 1.1 账号与权限

| 项 | 要求 |
|----|------|
| Oracle 账号 | **PANJOB**（即 EQUIPMENTINFO 表的 owner） |
| 权限 | PANJOB 作为表 owner 默认拥有 CREATE SESSION / CREATE TABLE，但**实测部分生产环境 PANJOB 缺少 CREATE SEQUENCE / CREATE TRIGGER 系统权限**（连显式 SQL 都报 ORA-01031），需要 DBA 一次性授权（见 1.3 节） |
| 不需要的权限 | **不需要 CREATE VIEW**（v1.4 已去掉视图） |
| 表空间配额 | PANJOB 默认表空间无配额限制（owner 默认 UNLIMITED） |
| DBA 介入 | **仅一次 GRANT 授权**（CREATE SEQUENCE + CREATE TRIGGER），见 1.3 节 |

### 1.2 验证 PANJOB 账号可用

用 Aqua Data Studio (ADS) 或 sqlplus 以 PANJOB 登录，执行：

```sql
-- 应返回当前用户 = PANJOB
SELECT USER FROM DUAL;
GO

-- 应返回 EQUIPMENTINFO 的行数 (>0 即可)
SELECT COUNT(*) FROM EQUIPMENTINFO;
GO

-- 应返回 PANJOB 默认表空间名 (= EQUIPMENTINFO 所在表空间)
SELECT DEFAULT_TABLESPACE FROM USER_USERS;
GO

-- ⚠️ 关键: 确认 PANJOB 有 CREATE SEQUENCE / CREATE TRIGGER 权限
--    若下面结果没有 CREATE SEQUENCE / CREATE TRIGGER, 必须先做 1.3 节 DBA 授权
SELECT PRIVILEGE FROM USER_SYS_PRIVS ORDER BY 1;
GO
```

若 `USER_SYS_PRIVS` 结果**缺少 CREATE SEQUENCE 或 CREATE TRIGGER**，必须先完成 1.3 节 DBA 授权，否则脚本段 3 会报 `ORA-01031: 权限不足`。

### 1.3 DBA 一次性授权（关键前置步骤）

请 DBA 用 SYS/SYSTEM 账号执行以下**一行 SQL**（一次性，永久生效）：

```sql
-- DBA 用 SYS/SYSTEM 登录执行:
GRANT CREATE SEQUENCE, CREATE TRIGGER TO PANJOB;
GO
```

**说明：**
- 这是 **DIRECT GRANT**（直接授权，非通过 ROLE），永久生效，不需要重复执行
- 授权后 PANJOB 就能创建 SEQUENCE 和 TRIGGER，本项目的 13 张业务表自增列才能工作
- 不影响 EQUIPMENTINFO 量产表（量产表已存在，不需要新建 SEQUENCE/TRIGGER）
- 若企业安全策略不允许 DIRECT GRANT，需走企业内部 DBA 工单流程

**授权后验证：**

```sql
-- PANJOB 登录后再次查询, 应能看到 CREATE SEQUENCE / CREATE TRIGGER
SELECT PRIVILEGE FROM USER_SYS_PRIVS ORDER BY 1;
GO
```

确认结果包含 `CREATE SEQUENCE` 和 `CREATE TRIGGER` 两行后，即可进入第 2 步部署。

---

## 2. 单步 SQL 部署：init_oracle.sql

> 全程 **Aqua Data Studio 登录 `PANJOB`**，确保 `GO` 批分隔符生效（ADS F5 = 整文件执行）。

### 2.1 执行 init_oracle.sql

| 项目 | 值 |
|------|----|
| 文件 | `backend/data/init_oracle.sql` |
| 登录用户 | **PANJOB**（**不是 SYS/SYSTEM！**） |
| ADS 执行方式 | **F5 / 双箭头 ▶️▶️（整文件执行，识别每个 GO 为一个块）** |
| 建表数量 | **13 张业务表**（PROJECTS / TASKS / CONFIGURATIONS / REQUIREMENTS / CHANGE_RECORDS / REPORTS / NOTES_DOCUMENTS / USERS / SYSTEM_SETTINGS / WORK_CATEGORIES / WORK_ITEMS / DAILY_PLANS / WORK_LOGS） |
| 自增对象 | 13 个 SEQUENCE + 13 个 TRIGGER（**显式 SQL 创建，非 PL/SQL 循环**，避开 ROLE 权限问题） |
| 是否建 EQUIPMENTINFO | **❌ 绝不！该表已存在且为生产数据** |
| 是否建 EQUIPMENT_TYPES 视图 | **❌ 不建**（PANJOB 可能无 CREATE VIEW 权限；前端类型下拉改为从机台列表前端去重） |
| 是否建指向 EQUIPMENTINFO 的外键 | **❌ 不建**（生产表 EQUIPMENT 列无 PK/UNIQUE 约束，建 FK 报 ORA-02270；改为后端应用层校验） |
| 是否使用 PRINT | **❌ 不用**（Oracle 不支持 PRINT，改用 SELECT ... FROM DUAL） |
| 是否使用 IDENTITY | **❌ 不用**（11g 不支持，部分 12c 报 ORA-02000；改用 SEQUENCE + TRIGGER） |
| 是否使用 PL/SQL 循环建 SEQ/TRG | **❌ 不用**（PL/SQL 块内 DDL 需要 DIRECT GRANT，ROLE 不行；改为 13 对显式 SQL） |
| 基础数据 | 项目 5 / 任务 8 / 需求 5 / 用户 3 / 系统设置 9 / 工作类别 8 (机台数据不插入，直接用 EQUIPMENTINFO 真表) |

**执行前 2 检查：**
- ✅ ADS 顶栏显示连接用户是 `PANJOB`（脚本第 0 段会 SELECT `CUR_USER` 与 `EQUIPMENTINFO_ROWS`，不对请中止）
- ✅ `EQUIPMENTINFO_ROWS > 0`（脚本会自检，为 0 或报 ORA-00942 会中止）

### 2.2 init_oracle.sql 脚本结构

| 段 | 内容 |
|----|------|
| 段 0 | 执行环境自检：当前用户、EQUIPMENTINFO 行数（用 SELECT 代替 PRINT） |
| 段 1 | DROP 既有业务表 + SEQUENCE + TRIGGER（PL/SQL 动态 DROP，不存在不报错，**严禁 DROP EQUIPMENTINFO**） |
| 段 2.1-2.13 | CREATE 13 张业务表（ID 列为 `NUMBER(10) PRIMARY KEY`，不使用 IDENTITY；**不建指向 EQUIPMENTINFO 的外键**；UNIQUE 约束的列不再重复建索引） |
| 段 3.1-3.13 | **显式 SQL** 创建 13 套 SEQUENCE + TRIGGER（不用 PL/SQL 循环，避开 ROLE 权限问题） |
| 段 4 | INSERT 业务基础数据（不指定 ID，TRIGGER 自动填，**不插入机台**） |
| 段 5 | 执行结果自检（14 行行数统计 + SEQUENCE/TRIGGER 数量验证） |

### 2.3 执行结果验收（脚本尾部自动打印）

| 表名 | 预期行数 | 说明 |
|------|---------|------|
| PROJECTS | 5 | 业务种子数据 |
| TASKS | 8 | 业务种子数据 |
| **EQUIPMENTINFO** | 量产真实机台数 | **生产真表，不受脚本影响** |
| CONFIGURATIONS | 0 | |
| REQUIREMENTS | 5 | 业务种子数据 |
| CHANGE_RECORDS | 0 | |
| REPORTS | 0 | |
| NOTES_DOCUMENTS | 0 | |
| USERS | 3 | administrator / eap.engineer / cim.user |
| SYSTEM_SETTINGS | 9 | 含 `git_source_base_url` + `git_source_map` 2 条 |
| WORK_CATEGORIES | 8 | |
| WORK_ITEMS | 0 | |
| DAILY_PLANS | 0 | |
| WORK_LOGS | 0 | |

**关键判定：**
- ✅ `EQUIPMENTINFO` 行数 = 量产真实机台数（脚本前后不变）
- ✅ 13 张业务表全部存在，行数符合预期
- ✅ USER_SEQUENCES 有 13 行，USER_TRIGGERS 有 13 行

```sql
-- 验证 SEQUENCE + TRIGGER 数量
SELECT COUNT(*) AS SEQ_CNT FROM USER_SEQUENCES WHERE SEQUENCE_NAME LIKE 'SEQ_%_ID';
GO
SELECT COUNT(*) AS TRG_CNT FROM USER_TRIGGERS WHERE TRIGGER_NAME LIKE 'TRG_%_BI';
GO
```
两个都应返回 13。

**单步部署完成！直接进入第 3 步配置 .env 即可启动。**

---

## 3. 后端 Oracle 连接配置（.env）

> 代码通过 `backend/config/settings.py` 读取，根据 `DATABASE_TYPE` 自动切换 SQLite/Oracle，**无需改任何代码**。

### 3.1 复制模板

```powershell
# Windows PowerShell:
cd C:\web\backend
Copy-Item .env.oracle.example .env

# Linux:
cp .env.oracle.example .env
```

### 3.2 必填项（所有 Oracle 环境必配）

```dotenv
DATABASE_TYPE=oracle
ORACLE_USER=PANJOB
ORACLE_PASSWORD=YourPanjobPassword
ORACLE_DSN=10.20.30.40:1521/ORCL
```

> ⚠️ **必须用 PANJOB 账号**，不能用 SYS/SYSTEM/其他账号。原因：
> - 后端 ORM `Equipment.__tablename__ = "EQUIPMENTINFO"`，不带 schema 前缀
> - SQLAlchemy 连接后默认 schema = 当前登录用户
> - 用 PANJOB 登录，SQL 会自动解析为 `PANJOB.EQUIPMENTINFO`
> - 用其他账号登录会报 `ORA-00942: table or view does not exist`

**ORACLE_DSN 格式：**

| 场景 | 值 |
|------|----|
| 单机 SID | `10.20.30.40:1521/ORCL` |
| 单机 Service Name | `10.20.30.40:1521/PROD_SVC.company.com` |
| RAC SCAN + Service | `scan-vip.company.com:1521/PROD_SVC` |
| TNS Name（本机 tnsnames.ora 有） | `PROD_TNS` |

> 密码含特殊字符：直接写，不要加引号（pydantic-settings 会自动处理）。

---

## 4. 代码部署与启动验证

### 4.1 环境 & 依赖

| 组件 | 最低要求 | 推荐 |
|------|---------|------|
| OS | Windows Server 2016 / CentOS 7 | Windows Server 2022 / RHEL 8 |
| Python | 3.9 | 3.11+ (oracledb 性能好) |
| Node.js | 18 LTS | 20 LTS |
| Oracle Client | 不需要 (python-oracledb 默认 thin 模式) | — |

```powershell
# 拉取代码 (必须是 test1 分支！本次量产对接代码只提交到 test1)
git clone https://github.com/leanerone/web.git
cd web
git checkout test1

# 后端依赖
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 前端依赖
cd ..
npm install --registry=https://registry.npmmirror.com
npm run build     # 生产构建 (产出 dist/)
```

### 4.2 先跑数据库连接自检（强烈推荐，别直接起 uvicorn）

```powershell
cd backend
@"
import os
os.environ.setdefault('PYTHONPATH', '.')
from config.settings import settings
from database.session import engine
from sqlalchemy import text

print(f'DB type : {settings.database_type}')
if settings.database_type == 'oracle':
    print(f'User/DSN: {settings.oracle_user} @ {settings.oracle_dsn}')

with engine.connect() as conn:
    # ① 当前用户应为 PANJOB
    r = conn.execute(text('SELECT USER FROM DUAL')).fetchone()
    print(f'当前用户: {r[0]}  (应为 PANJOB)')

    # ② EQUIPMENTINFO 行数 = 量产真实机台数
    r = conn.execute(text('SELECT COUNT(*) FROM EQUIPMENTINFO')).fetchone()
    print(f'EQUIPMENTINFO 行数: {r[0]}  (量产真实机台数)')

    # ③ 13 张业务表存在性检查
    r = conn.execute(text('SELECT COUNT(*) FROM USER_TABLES')).fetchone()
    print(f'业务表数: {r[0]}  (>=13 OK)')

    # ④ SEQUENCE + TRIGGER 数量
    r = conn.execute(text("SELECT COUNT(*) FROM USER_SEQUENCES WHERE SEQUENCE_NAME LIKE 'SEQ_%_ID'")).fetchone()
    print(f'SEQUENCE 数: {r[0]}  (应为 13)')
    r = conn.execute(text("SELECT COUNT(*) FROM USER_TRIGGERS WHERE TRIGGER_NAME LIKE 'TRG_%_BI'")).fetchone()
    print(f'TRIGGER 数: {r[0]}  (应为 13)')

    # ⑤ 抽样验证 18 列都能读 (会报列不存在, 就说明列名没对齐)
    r = conn.execute(text('SELECT EQUIPMENT, EQUIPMENTTYPE, EQUIPMENTMODEL, AREA, LINE, CCSERVER, CHARGEMAN, OS, SRVTYPE, SOURCECODE FROM EQUIPMENTINFO WHERE ROWNUM<=1')).fetchone()
    print(f'18 列抽样 OK: EQUIPMENT={r[0]} TYPE={r[1]} MODEL={r[2]} AREA={r[3]}')
print('OK - PANJOB 直连 + EQUIPMENTINFO 自检通过')
"@ | Out-File -Encoding UTF8 test_oracle_equipment.py

.\venv\Scripts\python.exe test_oracle_equipment.py
```

**输出判定：**
- 当前用户 = `PANJOB` → ✅ 否则改 .env
- EQUIPMENTINFO 行数 = 量产真实行数 (例如 1500) → ✅
- SEQUENCE 数 = 13 且 TRIGGER 数 = 13 → ✅
- 18 列抽样没抛错 = ✅ 可以启服务

### 4.3 启动服务 & 功能验证

```powershell
# 后端 (8000)
cd backend
$env:PYTHONPATH='.'
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

# 前端 (用 IIS/Nginx 托管 dist，或临时 5173 dev)
# 另开终端:
npm run dev
```

**登录账号（init_oracle.sql 已创建）：**

| 用户名 | 角色 | 初始密码 |
|--------|------|---------|
| `administrator` | admin | 空 / 首次登录后系统设置里重置 |
| `eap.engineer` | engineer | 同上 |
| `cim.user` | user | 同上 |

**量产机台功能验收清单（机台管理页面 http://<host>/equipment）：**

| # | 验证项 | 方法 | 通过条件 |
|---|--------|------|---------|
| 1 | 机台总数 | 进入页面看"机台统计"卡片 | 等于量产表真实行数 |
| 2 | 类型筛选 | 顶部筛选器 | 下拉为量产真实 EQUIPMENTTYPE 去重列表（前端从机台列表去重） |
| 3 | 搜索 | 输入机台编号/CC服务器/SOURCECODE | 列表实时过滤匹配 |
| 4 | 状态映射 | 查看状态徽标 | OS=Win → 在线，其他 OS → 维护，NULL → 离线 |
| 5 | 18 列展示 | 看 14 列表头 | 机台编号 / 类型 / 型号 / 厂区 / 产线 / CC服务器 / 负责人 / 操作系统 / 服务器类型 / SOURCE / 状态 / 位置 全部有值 |
| 6 | **Git Source 按钮** | 点每行 🐙 图标 | 新标签页跳转到 `git_source_base_url` + `git_source_map[SOURCECODE]` |
| 7 | 导出 CSV | 点"导出CSV" | 文件名 `equipment_list_YYYY-MM-DD.csv`，所有 14 列（含 GitURL）完整 |
| 8 | API 验证 | `GET /api/equipment?limit=5` | 返回 JSON 含 `equipment, equipment_type, source_code, line, chargeman, os` 等字段 |
| 9 | 只读验证 | 尝试 `POST /api/equipment` | 应返回 405 Method Not Allowed（无写路由） |

---

## 5. EQUIPMENTINFO 字段映射总览

### 5.1 列名对齐关系（Oracle EQUIPMENTINFO → ORM → Pydantic → 前端）

```
Oracle EQUIPMENTINFO 列    SQLAlchemy models.py          Pydantic schema             前端字段
──────────────────────    ─────────────────────────     ──────────────────         ──────────────
EQUIPMENT (PK)            equipment                     equipment                    eq_name (computed)
EQUIPMENTTYPE             equipment_type                equipment_type               eq_type (computed)
EQUIPMENTMODEL            equipment_model               equipment_model              eq_model (computed)
LINE                      line                          line                         line
CCSERVER                  cc_server                     cc_server                    server_id (computed)
AREA                      area                          area                         area
MOXA                      moxa                          moxa                         baud_rate (computed)
NPORT                     nport                         nport                        snmp_port (computed)
NPORTIP                   nport_ip                      nport_ip                     snmp_ip / driver1_ip (computed)
NPORTCOM                  nport_com                     nport_com                    driver1_port (computed)
CHARGEMAN                 chargeman                     chargeman                    chargeman
SMIF1NPORTIP              smif1_nport_ip                smif1_nport_ip               driver2_ip (computed)
SMIF2NPORTIP              smif2_nport_ip                smif2_nport_ip               driver2_port (computed)
SMIF3NPORTIP              smif3_nport_ip                smif3_nport_ip               —
SMIF4NPORTIP              smif4_nport_ip                smif4_nport_ip               —
OS                        os                            os                           os (同时决定 status)
SRVTYPE                   srv_type                      srv_type                     driver_type (computed)
SOURCECODE                source_code                   source_code                  🔘 Git Source 按钮

── 派生字段 (后端 @computed_field，非真实列) ────────────────────────────────
—                         —                             id (= equipment)             id / key
—                         —                             eq_name (= equipment)        eq_name
—                         —                             status (由 OS 派生)          status
—                         —                             location (Line/Area 拼接)    location
—                         —                             ap_id / ap_name / vendor 等   前端兼容字段
```

### 5.2 机台类型下拉（不建视图）

v1.3 不再创建 `EQUIPMENT_TYPES` 视图。前端类型下拉通过 `Equipment.tsx` 的 `useMemo` 从机台列表前端去重 `eq_type`：

```tsx
const equipmentTypes = useMemo(
  () => [...new Set(equipmentList.map(e => e.eq_type).filter(Boolean))],
  [equipmentList],
);
```

后端 `/api/equipment/types` 备用接口在 `equipment_service.get_equipment_types` 中直接 `SELECT DISTINCT EQUIPMENTTYPE FROM EQUIPMENTINFO`，不依赖任何视图。

### 5.3 状态派生规则 (EQUIPMENTINFO 无 STATUS 列)

```python
@computed_field
@property
def status(self) -> str:
    """OS 含 Win → online, NULL → offline, 其他 → maintenance"""
    if not self.os:
        return "offline"
    return "online" if "WIN" in self.os.upper() else "maintenance"
```

### 5.4 自增列方案 (显式 SEQUENCE + TRIGGER, 兼容 11g/12c)

v1.4 不使用 `GENERATED ... AS IDENTITY`（11g 不支持，部分 12c 环境也会报 ORA-02000），
也**不使用 PL/SQL 循环批量创建**（PL/SQL 块内 DDL 需要 DIRECT GRANT，ROLE 权限会报 ORA-01031）。

每张业务表的 ID 列为 `NUMBER(10) PRIMARY KEY`，由 **13 对显式 CREATE SEQUENCE + CREATE TRIGGER** 自动填充：

```sql
-- 13 张表各一对, 显式 SQL (init_oracle.sql 段 3.1-3.13)
CREATE SEQUENCE SEQ_PROJECTS_ID START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE
GO
CREATE OR REPLACE TRIGGER TRG_PROJECTS_BI
  BEFORE INSERT ON PROJECTS FOR EACH ROW WHEN (NEW.ID IS NULL)
BEGIN SELECT SEQ_PROJECTS_ID.NEXTVAL INTO :NEW.ID FROM DUAL; END;
GO
```

INSERT 语句不指定 ID 列，TRIGGER 自动从 SEQUENCE 取 NEXTVAL 填充。

### 5.5 EQUIPMENT_NAME 关联策略 (不建外键)

v1.4 不在 `CONFIGURATIONS.EQUIPMENT_NAME` / `REQUIREMENTS.EQUIPMENT_NAME` 上建外键指向 `EQUIPMENTINFO.EQUIPMENT`：

- **原因**：生产表 `EQUIPMENTINFO.EQUIPMENT` 列没有 PRIMARY KEY 或 UNIQUE 约束（生产表通常只关心数据写入性能，不强制约束），Oracle 外键要求被引用列必须有 UNIQUE 或 PK 约束，建 FK 会报 `ORA-02270: 此列列表的唯一关键字或主键不匹配`
- **替代方案**：`EQUIPMENT_NAME` 上建普通索引（提升查询性能），后端在 INSERT/UPDATE 时通过 `SELECT COUNT(*) FROM EQUIPMENTINFO WHERE EQUIPMENT = :name` 校验存在性
- **影响**：数据完整性由应用层保证，不影响前端展示与查询

---

## 6. Git Source (SOURCECODE) 对接说明

### 6.1 跳转规则

量产表 `SOURCECODE` 是源码分类码，前端用它拼接最终 Git URL：

```
GIT_URL = git_source_base_url + '/' + git_source_map[ SOURCECODE ]
```

这两个配置存在 `SYSTEM_SETTINGS` 表（category='equipment'），init_oracle.sql 第 3.5 段已写入默认值：

| Key | 默认值 |
|-----|--------|
| `git_source_base_url` | `https://github.com/leanerone/web/blob/main/equipment` |
| `git_source_map` | `{"1":"cpc/asm_eagle","2":"pecvd/asm_trident","3":"gateox/tel_8280","4":"tteox/thermawave_op5205t","5":"cateox/asml_8350"}` |

### 6.2 修改映射（生产环境真实值）

用 PANJOB 在 ADS 执行 UPDATE（不影响 EQUIPMENTINFO 量产数据！只改 SYSTEM_SETTINGS）：

```sql
UPDATE SYSTEM_SETTINGS
   SET VALUE = '{"1":"drivers/cpc/asm_eagle_10",
                 "2":"drivers/pecvd/asm_trident_xp",
                 "3":"drivers/gateox/tel_8280plus",
                 "4":"drivers/tteox/thermawave_op5205t",
                 "5":"drivers/cateox/asml_kedj8350",
                 "6":"drivers/lithography/nikon_nsr630",
                 "7":"drivers/lam_etch_kiyo",
                 "8":"drivers/cvd_amat_centura"}'
 WHERE KEY = 'git_source_map'
   AND CATEGORY = 'equipment'
GO
COMMIT
GO
```

刷新前端页面或重调 `settingsAPI.list('equipment')`，Git Source 按钮立即用新映射。

### 6.3 前端实现（不用改）

- `Equipment.tsx` 加载机台时并行调用 `GET /api/settings?category=equipment` 拉两条配置
- 失败 fallback 到 `DEFAULT_GIT_BASE_URL / DEFAULT_GIT_SOURCE_MAP` (代码内常量)
- 没 SOURCECODE 或 SOURCECODE 不在 map 中：🐙 图标灰色禁用 + tooltip 提示

---

## 7. 故障排查 FAQ

### Q1. 报 `ORA-00942: table or view does not exist` on `EQUIPMENTINFO`
**原因**：.env 中 `ORACLE_USER` 不是 PANJOB（用其他账号登录，schema 不对）。
**处理**：改 .env 中 `ORACLE_USER=PANJOB`，重启后端。SQLAlchemy 不带 schema 前缀，必须用 owner 账号登录。

### Q2. init_oracle.sql 段 0 自检中止：EQUIPMENTINFO_ROWS = 0
**两种情况：**
- 当前账号不是 PANJOB（看 CUR_USER 输出）→ 改 ADS 连接
- PANJOB 下确实没有 EQUIPMENTINFO 表（极少见）→ 找 DBA 确认表 owner

### Q3. `ORA-00900: 无效 SQL 语句` on `PRINT`
**原因**：Oracle 不支持 SQL Server 的 `PRINT` 语句。
**处理**：v1.3 已全部改用 `SELECT '...' AS MSG FROM DUAL`。若仍报错说明用的是旧版脚本，请拉最新 test1 分支。

### Q4. `ORA-02000: 缺失 ALWAYS 关键字` on `GENERATED ... AS IDENTITY`
**原因**：Oracle 11g 不支持 IDENTITY 列；部分 12c 环境对 `BY DEFAULT ON NULL` 子句解析异常。
**处理**：v1.3 已改用 SEQUENCE + TRIGGER，兼容 11g/12c。若仍报错说明用的是旧版脚本，请拉最新 test1 分支。

### Q5. `ORA-01031: 权限不足` on `CREATE OR REPLACE VIEW`
**原因**：PANJOB 没有 CREATE VIEW 系统权限。
**处理**：v1.3 已去掉 EQUIPMENT_TYPES 视图，前端类型下拉改为从机台列表前端去重，后端 `/types` 直接查 EQUIPMENTINFO DISTINCT。若仍报错说明用的是旧版脚本，请拉最新 test1 分支。

### Q6. `ORA-00955: 名称已由现有对象使用` on CREATE TABLE
**原因**：表已存在，重复执行 init_oracle.sql。
**处理**：脚本段 1 的 PL/SQL 动态 DROP 应该已自动处理（含 SEQUENCE/TRIGGER），若仍报错：
```sql
PURGE RECYCLEBIN
GO
```
再重跑 init_oracle.sql。

### Q7. 前端页面机台统计卡片显示 0 台
**原因排查**：
- 后端 `.env` 是 SQLite（DATABASE_TYPE=sqlite）→ 改为 oracle 重启
- 后端连的不是 PANJOB → 报 ORA-00942，看后端日志
- `GET /api/equipment` 返回 success=false → 看后端日志的 SQL 错误

### Q8. 前端 Git Source 按钮灰色
**两种情况：**
- 机台的 `SOURCECODE` = NULL（量产表没填），正常：请在 MES/EAP 量产表补 SOURCECODE
- `SOURCECODE` 有值但 `git_source_map` JSON 缺对应 key → 按 6.2 节 UPDATE SYSTEM_SETTINGS 加入该 key

### Q9. 启动后端报错 DPY-3010 / ORA-12541 / ORA-12514 / ORA-01017
| 错 | 含义 | 处理 |
|----|------|------|
| DPY-3010 | TNS 解析错 | `.env` ORACLE_DSN 格式 |
| ORA-12541 | 无监听 | Oracle listener 没开或 IP:Port 不通 |
| ORA-12514 | SID/服务名错 | 向 DBA 核对真实 SERVICE_NAME |
| ORA-01017 | 账号密码错 | PANJOB 密码大小写敏感，.env 不加引号 |
| ORA-28000 | 账号被锁 | 找 DBA `ALTER USER PANJOB ACCOUNT UNLOCK;` |

### Q10. 想新建机台/修改机台主数据怎么办？
**不能通过本项目！** 后端 `/api/equipment` 只提供 GET 路由，无 POST/PUT/DELETE。

机台主数据的增删改请走原 MES/EAP 量产系统操作 `PANJOB.EQUIPMENTINFO`，本项目只读展示。

### Q11. 想看哪些需求关联了某台机台
```sql
SELECT r.ID, r.TITLE, r.STATUS, r.EQUIPMENT_NAME
  FROM REQUIREMENTS r
 WHERE r.EQUIPMENT_NAME = '你的机台编号'
GO
```
（`EQUIPMENT_NAME` 不建外键，由后端应用层校验存在性）

### Q12. `ORA-02270: 此列列表的唯一关键字或主键不匹配` on `FOREIGN KEY ... REFERENCES EQUIPMENTINFO(EQUIPMENT)`
**原因**：生产表 `EQUIPMENTINFO.EQUIPMENT` 列没有 PK 或 UNIQUE 约束，Oracle 不允许建外键指向它。
**处理**：v1.4 已去掉指向 EQUIPMENTINFO 的外键，`EQUIPMENT_NAME` 只建普通索引，后端应用层校验存在性。若仍报错说明用的是旧版脚本，请拉最新 test1 分支。

### Q13. `ORA-01031: 权限不足` on `CREATE SEQUENCE` / `CREATE TRIGGER` (显式 SQL 也报错)
**原因**：PANJOB 账号在生产环境中**完全没有 CREATE SEQUENCE / CREATE TRIGGER 系统权限**（连显式 SQL 都报错，说明不是 ROLE 授权问题，是权限缺失）。
**处理**：找 DBA 用 SYS/SYSTEM 执行一行 SQL（一次性，永久生效）：
```sql
GRANT CREATE SEQUENCE, CREATE TRIGGER TO PANJOB;
GO
```
授权后**不需要重跑整个 init_oracle.sql**，只需在 ADS 中重新执行脚本**段 3.1-3.13**（CREATE SEQUENCE + CREATE TRIGGER 部分）和**段 4**（INSERT 数据）即可。详见 1.3 节。
**验证授权成功**：
```sql
SELECT PRIVILEGE FROM USER_SYS_PRIVS WHERE PRIVILEGE IN ('CREATE SEQUENCE','CREATE TRIGGER');
GO
```
应返回 2 行。

### Q14. `ORA-01408: 此列列表已索引` on `CREATE INDEX IDX_USERS_USERNAME` 等
**原因**：表定义已有 `CONSTRAINT UK_USERS_USERNAME UNIQUE (USERNAME)`，UNIQUE 约束会自动创建唯一索引，再 `CREATE INDEX` 同列会重复。
**处理**：v1.4 已去掉 3 个冗余索引（IDX_USERS_USERNAME / IDX_SYS_SETTINGS_KEY / IDX_WORK_CATEGORIES_CODE），保留 UNIQUE 约束自动建的索引即可。若仍报错说明用的是旧版脚本，请拉最新 test1 分支。

---

## 8. 附录：业务表一览

> **再次强调**：下面 13 张表全部创建在 `PANJOB` 用户下（= EQUIPMENTINFO 所在表空间），对 `EQUIPMENTINFO` 量产真表**无任何 DDL/DML**，只读 SELECT。

| # | 表名 | 中文说明 | init 行数 | 备注 |
|---|------|---------|-----------|------|
| 1 | PROJECTS | 项目表 | 5 | |
| 2 | TASKS | 任务表 | 8 | |
| — | **EQUIPMENTINFO** | 机台主表 | **量产真实行数** | **生产真表，本项目不创建/不修改，ORM 直接映射只读** |
| 3 | CONFIGURATIONS | 机台配置项历史 | 0 | 外键引用 EQUIPMENTINFO.EQUIPMENT |
| 4 | REQUIREMENTS | 需求表 | 5 | 外键引用 EQUIPMENTINFO.EQUIPMENT |
| 5 | CHANGE_RECORDS | 需求变更记录 | 0 | |
| 6 | REPORTS | 报表存储 | 0 | |
| 7 | NOTES_DOCUMENTS | Notes 文档同步 | 0 | |
| 8 | USERS | 系统用户 | 3 | administrator / eap.engineer / cim.user |
| 9 | SYSTEM_SETTINGS | 系统设置 KV | 9 | 含 git_source_* 2 条 |
| 10 | WORK_CATEGORIES | 工作类别字典 | 8 | |
| 11 | WORK_ITEMS | 工作项（待办） | 0 | |
| 12 | DAILY_PLANS | 每日计划 | 0 | |
| 13 | WORK_LOGS | 工作项变更日志 | 0 | |

每张表配套 1 个 SEQUENCE（`SEQ_<表名>_ID`）+ 1 个 TRIGGER（`TRG_<表名>_BI`），共 26 个自增对象。

### 文件清单

| 路径 | 说明 |
|------|------|
| `DEPLOY_ORACLE_SOP.md` | 本 SOP |
| `backend/data/init_oracle.sql` | **单步部署 SQL**：建 13 张业务表 + SEQUENCE/TRIGGER + 业务种子数据 |
| `backend/.env.oracle.example` | .env 模板（ORACLE_USER=PANJOB，复制为 .env 使用） |
| `backend/config/settings.py` | 读取 .env (DATABASE_TYPE, ORACLE_USER, ORACLE_PASSWORD, ORACLE_DSN) |
| `backend/database/session.py` | 根据 DATABASE_TYPE 动态生成 Oracle/SQLite URL (无需改) |
| `backend/database/models.py` | `Equipment.__tablename__="EQUIPMENTINFO"` 直接映射 18 列真表 |
| `backend/schemas/equipment.py` | EquipmentResponse 18 真实列 + @computed_field 派生前端兼容字段 |
| `backend/routes/equipment.py` | `/api/equipment` REST API (只读 GET，无写路由) |
| `backend/services/equipment_service.py` | ORM 查询 (按 EQUIPMENT/EQUIPMENTTYPE/AREA/LINE 筛选；/types 直接 DISTINCT 不依赖视图) |
| `src/types/index.ts` | 前端 Equipment 接口：扩充 source_code / line / chargeman / os 等量产字段 |
| `src/pages/Equipment.tsx` | 机台管理 UI：14 列量产真实信息展示 + 🐙 Git Source 跳转按钮 + 前端类型去重 |
| `backend/requirements.txt` | 含 `oracledb==2.4.0` (thin 模式, 不用 Oracle Client) |

---

## 部署流程速记（极简版）

```
0. DBA 用 SYS/SYSTEM 执行: GRANT CREATE SEQUENCE, CREATE TRIGGER TO PANJOB;  (一次性)
   ↓
1. ADS 用 PANJOB 登录 → 验证 USER_SYS_PRIVS 含 CREATE SEQUENCE / CREATE TRIGGER
   ↓
2. 执行 init_oracle.sql (F5 整文件)
   ↓ (单步完成；无 PRINT，无 IDENTITY，无 CREATE VIEW，无指向 EQUIPMENTINFO 的外键)
3. backend/ 下复制 .env.oracle.example 为 .env
   ↓
4. 编辑 .env: DATABASE_TYPE=oracle, ORACLE_USER=PANJOB, ORACLE_PASSWORD=xxx, ORACLE_DSN=xxx
   ↓
5. 跑 test_oracle_equipment.py 自检
   ↓
6. 启动 uvicorn + 前端 → 访问 /equipment 验证机台列表 = 量产真实数据
```

**如果之前已经执行过失败的 init_oracle.sql（表已建但 SEQUENCE/TRIGGER 没建）：**
- DBA 授权后，只需在 ADS 中重新执行脚本**段 3.1-3.13**（CREATE SEQUENCE + CREATE TRIGGER）+ **段 4**（INSERT 数据），不需要重跑建表段。

---

> 如有部署问题：
> 1. 先查 **第 4.2 节** `test_oracle_equipment.py` 输出，99% 的问题在此处能定位
> 2. Oracle/ADS 报错：对照 **第 7 节 FAQ**，ORA-00900/ORA-02000/ORA-01031 均已在 v1.3 修复
> 3. 前端不展示量产列 → 清浏览器缓存 / DevTools 看 `GET /api/equipment` 返回值是否含 source_code 等字段（不含 → 后端版本不是 test1 分支）
