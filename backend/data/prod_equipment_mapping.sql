-- ============================================================================
-- 量产机台表对接脚本  ·  部署第二步 (第一步 init_oracle.sql 跑完后立刻执行)
-- 适用: Aqua Data Studio (批处理分隔符: GO)
-- 连接用户: CIM_WEB_USER (不是 SYS/PANJOB)
--
-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║  本脚本做两件事：                                                      ║
-- ║    ① 备份 init_oracle.sql 创建的本地 EQUIPMENT/EQUIPMENT_TYPES 表     ║
-- ║    ② 建同名【只读视图】指向生产库已存在的 PANJOB.EQUIPMENTINFO        ║
-- ║       (PANJOB.EQUIPMENTINFO 表已存在，本脚本不会、也严禁新建它！)      ║
-- ╚════════════════════════════════════════════════════════════════════════╝
--
-- 前置: DBA 必须提前执行一次 (在 SYS 或 PANJOB 用户下):
--   GRANT SELECT ON PANJOB.EQUIPMENTINFO TO CIM_WEB_USER;
--   GRANT CREATE VIEW, CREATE SYNONYM TO CIM_WEB_USER;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. 自检: 确认运行用户是 CIM_WEB_USER 且能读到量产表
-- ----------------------------------------------------------------------------
SELECT USER AS CUR_USER,
       CASE WHEN EXISTS (
            SELECT 1 FROM ALL_TAB_PRIVS
             WHERE TABLE_SCHEMA='PANJOB' AND TABLE_NAME='EQUIPMENTINFO'
               AND GRANTEE=USER
           ) THEN 'YES' ELSE 'NO - 请先让DBA执行GRANT SELECT' END AS HAS_GRANT
  FROM DUAL
GO

-- ----------------------------------------------------------------------------
-- 1. 备份: RENAME init_oracle.sql 建的演示 EQUIPMENT/EQUIPMENT_TYPES 表
--    (PL/SQL 安全执行, 对象已不存在也不报错)
-- ----------------------------------------------------------------------------
DECLARE
  PROCEDURE rename_if_exists(p_old IN VARCHAR2, p_new IN VARCHAR2) IS
  BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE ' || p_old || ' RENAME TO ' || p_new;
    DBMS_OUTPUT.PUT_LINE('RENAME OK  : ' || p_old || ' -> ' || p_new);
  EXCEPTION WHEN OTHERS THEN
    IF SQLCODE IN (-942, -1418) THEN NULL;
    ELSE RAISE; END IF;
  END;
BEGIN
  rename_if_exists('EQUIPMENT',         'EQUIPMENT_LOCAL_BAK');
  rename_if_exists('EQUIPMENT_TYPES',   'EQUIPMENT_TYPES_LOCAL_BAK');
END;
GO

-- ----------------------------------------------------------------------------
-- 2. 建视图 EQUIPMENT_TYPES (从量产表按 EQUIPMENTTYPE 去重)
--    → 后端 /api/equipment/types 及前端左侧筛选直接用
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW EQUIPMENT_TYPES AS
SELECT
    ROW_NUMBER() OVER (ORDER BY EQUIPMENTTYPE)        AS ID,
    EQUIPMENTTYPE                                     AS NAME,
    '量产机台类型: ' || EQUIPMENTTYPE                 AS DESCRIPTION,
    CAST(NULL AS VARCHAR2(100))                       AS MANUFACTURER
  FROM (SELECT DISTINCT EQUIPMENTTYPE
          FROM PANJOB.EQUIPMENTINFO
         WHERE EQUIPMENTTYPE IS NOT NULL)
GO
COMMENT ON TABLE EQUIPMENT_TYPES IS 'VIEW: 量产 PANJOB.EQUIPMENTINFO 机台类型去重'
GO

-- ----------------------------------------------------------------------------
-- 3. 建视图 EQUIPMENT
--    输出列 = ORM 核心 8 列 + PANJOB.EQUIPMENTINFO 真实 18 列 + 2 预留列
--    列名严格对齐 backend/database/models.py 里的 Equipment 模型 (包括大写列名 alias)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW EQUIPMENT AS
SELECT
    -- ── ORM 核心列 (models.py 定义的字段名) ──
    ROW_NUMBER() OVER (ORDER BY E.EQUIPMENT)          AS ID,
    T.ID                                              AS TYPE_ID,
    E.EQUIPMENT                                       AS NAME,
    'Line:' || NVL(E.LINE,'-') || ' / Area:' || NVL(E.AREA,'-')
                                                      AS LOCATION,
    CASE
        WHEN UPPER(E.OS) LIKE '%WIN%' THEN 'online'
        WHEN E.OS IS NULL              THEN 'offline'
        ELSE                                'maintenance'
    END                                               AS STATUS,
    'SRVTYPE:' || NVL(E.SRVTYPE,'?') || ' OS:' || NVL(E.OS,'?')
                                                      AS DRIVER_VERSION,
    CAST(NULL AS DATE)                                AS INSTALLED_AT,
    SYSTIMESTAMP                                      AS UPDATED_AT,

    -- ── 量产真实 18 列 (models.py 中: 小写字段名 + Column("大写列名"))
    --    视图别名必须等于 models.py Column("XXX") 里的大写值，
    --    这样 SQLAlchemy 执行 SELECT * 时才能正确读到属性。
    E.EQUIPMENT                                       AS EQUIPMENT,
    E.EQUIPMENTTYPE                                   AS EQUIPMENTTYPE,
    E.EQUIPMENTMODEL                                  AS EQUIPMENTMODEL,
    E.LINE                                            AS LINE,
    E.CCSERVER                                        AS CCSERVER,
    E.AREA                                            AS AREA,
    E.MOXA                                            AS MOXA,
    E.NPORT                                           AS NPORT,
    E.NPORTIP                                         AS NPORTIP,
    E.NPORTCOM                                        AS NPORTCOM,
    E.CHARGEMAN                                       AS CHARGEMAN,
    E.SMIF1NPORTIP                                    AS SMIF1NPORTIP,
    E.SMIF2NPORTIP                                    AS SMIF2NPORTIP,
    E.SMIF3NPORTIP                                    AS SMIF3NPORTIP,
    E.SMIF4NPORTIP                                    AS SMIF4NPORTIP,
    E.OS                                              AS OS,
    E.SRVTYPE                                         AS SRVTYPE,
    E.SOURCECODE                                      AS SOURCECODE,
    -- ── 预留列 (量产表实际未用, 视图里填 NULL 占列位) ──
    CAST(NULL AS VARCHAR2(32))                        AS EXTRA19,
    CAST(NULL AS VARCHAR2(32))                        AS EXTRA20
  FROM PANJOB.EQUIPMENTINFO E
  LEFT JOIN (SELECT ID, NAME FROM EQUIPMENT_TYPES) T
         ON T.NAME = E.EQUIPMENTTYPE
GO
COMMENT ON TABLE EQUIPMENT IS 'VIEW: 量产 PANJOB.EQUIPMENTINFO → 项目机台管理 (只读)'
GO

-- ----------------------------------------------------------------------------
-- 4. 写入 Git Source 根 URL 与 SOURCECODE 映射字典到 SYSTEM_SETTINGS
--    前端机台列表点 "Git Source" 按钮时, 会用 system_setting 中的配置拼 URL:
--    GIT_URL = git_source_base_url + '/' + git_source_map[ SOURCECODE ]
-- ----------------------------------------------------------------------------
DECLARE
  PROCEDURE upsert_setting(p_key VARCHAR2, p_val VARCHAR2, p_desc VARCHAR2, p_cat VARCHAR2) IS
  BEGIN
    UPDATE SYSTEM_SETTINGS SET VALUE=p_val, DESCRIPTION=p_desc, CATEGORY=p_cat WHERE KEY=p_key;
    IF SQL%ROWCOUNT = 0 THEN
      INSERT INTO SYSTEM_SETTINGS(KEY, VALUE, DESCRIPTION, CATEGORY)
      VALUES (p_key, p_val, p_desc, p_cat);
    END IF;
  END;
BEGIN
  upsert_setting(
    'git_source_base_url',
    'https://github.com/leanerone/web/blob/main/equipment',
    'Git Source 根 URL 前缀, SOURCECODE 对应子目录拼到此处',
    'equipment'
  );
  upsert_setting(
    'git_source_map',
    '{"1":"cpc/asm_eagle","2":"pecvd/asm_trident","3":"gateox/tel_8280","4":"tteox/thermawave_op5205t","5":"cateox/asml_8350"}',
    'SOURCECODE值 → Git子目录 映射 JSON (key=SOURCECODE值)',
    'equipment'
  );
  COMMIT;
END;
GO

-- ----------------------------------------------------------------------------
-- 5. 校验: 对比行数 & 抽样展示核心列 & SOURCECODE Git URL 拼接
-- ----------------------------------------------------------------------------
SELECT 'PANJOB.EQUIPMENTINFO'   AS 数据源,       COUNT(*) AS 行数
  FROM PANJOB.EQUIPMENTINFO
UNION ALL
SELECT 'EQUIPMENT(VIEW→量产)',                  COUNT(*) FROM EQUIPMENT
UNION ALL
SELECT 'EQUIPMENT_TYPES(VIEW)',                 COUNT(*) FROM EQUIPMENT_TYPES
GO

-- 抽样前 8 行核心列
SELECT
    ID           AS 伪ID,
    EQUIPMENT    AS 机台编号,
    EQUIPMENTTYPE AS 类型,
    EQUIPMENTMODEL AS 型号,
    AREA         AS 厂区,
    LINE         AS 产线,
    CCSERVER     AS CC服务器,
    CHARGEMAN    AS 负责人,
    OS           AS 操作系统,
    SRVTYPE      AS 服务器类型,
    SOURCECODE   AS SOURCE源码分类,
    STATUS       AS 机台状态
FROM EQUIPMENT
WHERE ROWNUM <= 8
ORDER BY ID
GO

-- SOURCECODE → Git URL 抽样 (只看有 SOURCECODE 的机台)
SELECT
    EQUIPMENT                                           AS 机台编号,
    SOURCECODE                                          AS SOURCECODE,
    (SELECT VALUE FROM SYSTEM_SETTINGS WHERE KEY='git_source_base_url')
      || '/' ||
      JSON_VALUE((SELECT VALUE FROM SYSTEM_SETTINGS WHERE KEY='git_source_map'),
                 '$."' || SOURCECODE || '"')            AS 期望GitURL
FROM EQUIPMENT
WHERE SOURCECODE IS NOT NULL
  AND ROWNUM <= 10
ORDER BY SOURCECODE, EQUIPMENT
GO

PRINT '==========================================================='
PRINT ' 量产机台视图映射已完成 ✓'
PRINT '   · EQUIPMENT        → 只读视图 → PANJOB.EQUIPMENTINFO'
PRINT '   · EQUIPMENT_TYPES  → 只读视图 → 量产类型去重'
PRINT '   · git_source_*     → 已写入 SYSTEM_SETTINGS'
PRINT ''
PRINT ' 若上方 EQUIPMENT 行数 = 0，先让 DBA 执行:'
PRINT '   GRANT SELECT ON PANJOB.EQUIPMENTINFO TO CIM_WEB_USER;'
PRINT '==========================================================='
GO
