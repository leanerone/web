import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Cpu,
  Search,
  RefreshCw,
  Download,
  Github,
  Copy,
  Link2,
  Settings,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Database,
  Eye,
} from 'lucide-react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { EquipmentStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { useList, useDebouncedValue } from '@/hooks/useList';
import { equipmentAPI, settingsAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Equipment } from '@/types';

const inputCls =
  'rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none';

// 默认 Git Source 映射 (后端 SYSTEM_SETTINGS 未加载成功时的 fallback)
// key = "equipment_type|equipment_model"
const DEFAULT_GIT_BASE_URL = 'https://github.com/leanerone/web/blob/main/equipment';
const DEFAULT_GIT_SOURCE_MAP: Record<string, string> = {
  'CPC|ASM-8350V-LPT': 'cpc/asm_eagle',
  'PECVD|ASM-Trident': 'pecvd/asm_trident',
  'GATEOX|TEL-82800S': 'gateox/tel_8280',
  'TTOX|Thermawave-OP5205T': 'tteox/thermawave_op5205t',
  'CATEOX|ASML-PAS5500': 'cateox/asml_8350',
};

// SOURCECODE 产线含义 (0=通用, 1=LINE1, 2=LINE2)
function getSourceLineLabel(code?: string): string {
  switch (String(code ?? '').trim()) {
    case '0': return '通用';
    case '1': return 'LINE1';
    case '2': return 'LINE2';
    default: return '';
  }
}

function buildGitSourceKey(item: Equipment): string {
  const t = String(item.equipment_type ?? item.eq_type ?? '').trim();
  const m = String(item.equipment_model ?? item.eq_model ?? '').trim();
  return `${t}|${m}`;
}

export default function Equipment() {
  const navigate = useNavigate();
  const { setEquipment } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [refreshing, setRefreshing] = useState(false);
  const [gitBaseUrl, setGitBaseUrl] = useState<string>(DEFAULT_GIT_BASE_URL);
  const [gitSourceMap, setGitSourceMap] = useState<Record<string, string>>(DEFAULT_GIT_SOURCE_MAP);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [gitEditBaseUrl, setGitEditBaseUrl] = useState('');
  const [gitEditMap, setGitEditMap] = useState<Array<{ code: string; path: string }>>([]);
  const [gitSaving, setGitSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  /** 统计用全量数据（仅首次/手动刷新时拉取一次），表格走服务端分页 */
  const [statsData, setStatsData] = useState<Equipment[]>([]);

  /** Git Source 映射 + 统计全量（并行，低频） */
  const fetchMeta = useCallback(async () => {
    try {
      const [eqRes, setRes] = await Promise.all([
        equipmentAPI.list({ page: 1, limit: 10000 }),
        settingsAPI.list('equipment').catch(() => ({ success: false, data: [] as { key: string; value: string }[] })),
      ]);
      if (eqRes.success) {
        setStatsData(eqRes.data);
        setEquipment(eqRes.data);
      }
      if (setRes.success && Array.isArray(setRes.data)) {
        const baseRow = setRes.data.find((s) => s.key === 'git_source_base_url');
        const mapRow = setRes.data.find((s) => s.key === 'git_source_map');
        if (baseRow?.value) setGitBaseUrl(baseRow.value);
        if (mapRow?.value) {
          try { setGitSourceMap(JSON.parse(mapRow.value)); } catch { /* 保持默认 */ }
        }
      }
    } catch {
      toast.error('机台统计加载失败，量产环境需配置 PANJOB 数据库连接');
    }
  }, [setEquipment]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  /** 表格数据：服务端 keyword/type 筛选 + 分页（每页 50，不再全量拉取） */
  const { data: pageData, total, loading, refresh } = useList<Equipment, Record<string, unknown>>(
    (p) => equipmentAPI.list(p as { page: number; limit: number; keyword?: string; equipment_type?: string }),
    {
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch.trim() ? { keyword: debouncedSearch.trim() } : {}),
      ...(typeFilter !== 'all' ? { equipment_type: typeFilter } : {}),
    }
  );

  // 状态筛选后端不支持，在当前页内过滤
  const tableData = useMemo(
    () => (statusFilter === 'all' ? pageData : pageData.filter((e) => e.status === statusFilter)),
    [pageData, statusFilter]
  );

  // 关键字/类型变化时回到第一页
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), fetchMeta()]);
    setRefreshing(false);
  };

  const buildGitUrl = (item: Equipment): string => {
    const key = buildGitSourceKey(item);
    if (!key || key === '|') return '';
    const sub = gitSourceMap[key];
    if (!sub) return '';
    return `${gitBaseUrl.replace(/\/$/, '')}/${sub}`;
  };

  const handleExport = () => {
    const headers = ['机台编号', '机台类型', '机台型号', '厂区', '产线', 'CC服务器', '负责人', '操作系统', '服务器类型', 'SOURCE源码分类', '状态', '位置', 'GitURL'];
    const rows = tableData.map((item) => [
      item.eq_name, item.eq_type, item.eq_model, item.area, item.line ?? '',
      item.server_id, item.chargeman ?? '', item.os ?? '', item.driver_type,
      item.source_code ?? '', item.status, item.location, buildGitUrl(item),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `equipment_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('已导出 CSV');
  };

  const handleCopyCode = async (item: Equipment) => {
    const text = item.eq_name || item.equipment || String(item.id);
    const key = String(item.equipment ?? item.id ?? item.eq_name);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* 忽略 */ }
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    toast.success(`已复制 ${text}`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleViewRequirements = (item: Equipment) => {
    const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
    navigate(`/requirements?equipment=${encodeURIComponent(eqKey)}`);
  };

  const openGitModal = () => {
    setGitEditBaseUrl(gitBaseUrl);
    setGitEditMap(Object.entries(gitSourceMap).map(([code, path]) => ({ code, path })));
    setIsGitModalOpen(true);
  };

  const handleGitSave = async () => {
    setGitSaving(true);
    try {
      const filtered = gitEditMap.filter((r) => r.code.trim() && r.path.trim());
      const newMap: Record<string, string> = {};
      filtered.forEach((r) => { newMap[r.code.trim()] = r.path.trim(); });
      const baseUrl = gitEditBaseUrl.trim() || DEFAULT_GIT_BASE_URL;
      await Promise.all([
        settingsAPI.update('git_source_base_url', baseUrl, 'Git Source 根地址', 'equipment'),
        settingsAPI.update('git_source_map', JSON.stringify(newMap), 'EquipmentType|Model -> Git 子路径映射', 'equipment'),
      ]);
      setGitBaseUrl(baseUrl);
      setGitSourceMap(newMap);
      setIsGitModalOpen(false);
      toast.success('Git Source 配置已保存');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setGitSaving(false);
    }
  };

  const equipmentTypes = useMemo(
    () => [...new Set(statsData.map((e) => e.eq_type).filter(Boolean))],
    [statsData],
  );

  const stats = useMemo(() => ([
    { label: '机台总数', value: statsData.length, tone: 'bg-accent-50 text-accent-600' },
    { label: '在线', value: statsData.filter((e) => e.status === 'online').length, tone: 'bg-emerald-50 text-emerald-600' },
    { label: '维护中', value: statsData.filter((e) => e.status === 'maintenance').length, tone: 'bg-amber-50 text-amber-600' },
    { label: '离线', value: statsData.filter((e) => e.status === 'offline').length, tone: 'bg-red-50 text-red-600' },
    { label: '机型数', value: equipmentTypes.length, tone: 'bg-blue-50 text-blue-600' },
    { label: '有 Git 源码', value: statsData.filter((e) => buildGitUrl(e)).length, tone: 'bg-violet-50 text-violet-600' },
  ]), [statsData, equipmentTypes, gitBaseUrl, gitSourceMap]);

  const COL_COUNT = 14;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="animate-fade-in space-y-4">
      {/* 数据来源说明（精简为一行） */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-500">
        <Database className="h-3.5 w-3.5 flex-shrink-0 text-accent-500" />
        <span>
          量产数据只读直连 <code className="rounded bg-gray-100 px-1 font-mono">PANJOB.EQUIPMENTINFO</code>，
          主键 EQUIPMENT，状态由 OS 字段派生（Win → 在线），不会修改量产数据
        </span>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <p className={`inline-flex rounded-lg px-2 py-0.5 text-lg font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="mt-1 text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索编号 / 类型 / 型号 / 负责人 / SOURCE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputCls} sm:w-40`}>
            <option value="all">全部机台类型</option>
            {equipmentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} sm:w-32`}>
            <option value="all">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="maintenance">维护中</option>
            <option value="decommissioned">已停用</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw className="h-4 w-4" /> 刷新
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={tableData.length === 0}>
            <Download className="h-4 w-4" /> 导出 CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={openGitModal}>
            <Settings className="h-4 w-4" /> Git Source 配置
          </Button>
        </div>
      </div>

      {/* 机台表格 */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[1600px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-medium text-gray-500">
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">机台编号</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">类型</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">型号</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">厂区</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">产线</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">CC服务器</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">负责人</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">操作系统</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">服务器类型</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">SOURCE</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">状态</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">位置</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">源码</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: COL_COUNT }).map((_, j) => (
                    <td key={j} className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="py-14 text-center">
                  <Cpu className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                  <p className="text-sm text-gray-400">暂无机台记录</p>
                  <p className="mt-1 text-xs text-gray-300">量产环境需在后端配置 PANJOB 数据库连接；本地模式可先导入机台 CSV</p>
                </td>
              </tr>
            ) : (
              tableData.map((item) => {
                const gitUrl = buildGitUrl(item);
                const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
                const isCopied = copiedKey === eqKey;
                return (
                  <tr key={eqKey} className="group transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/equipment/${encodeURIComponent(eqKey)}`)}
                          className="font-medium text-accent-600 hover:text-accent-700 hover:underline"
                          title="查看详情"
                        >
                          {item.eq_name}
                        </button>
                        <button
                          onClick={() => handleCopyCode(item)}
                          title="复制机台编号"
                          className="rounded p-1 text-gray-300 transition-colors hover:bg-accent-50 hover:text-accent-600"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">{item.eq_type || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">{item.eq_model || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">{item.area || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">{item.line || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-gray-500">{item.server_id || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">{item.chargeman || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">{item.os || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-500">{item.driver_type || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {item.source_code ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-xs font-medium text-violet-700"
                          title={`SOURCECODE=${item.source_code}（产线区分）`}
                        >
                          <span className="font-mono">{item.source_code}</span>
                          <span className="text-violet-400">·</span>
                          <span>{getSourceLineLabel(item.source_code)}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <EquipmentStatusBadge status={item.status} />
                    </td>
                    <td className="max-w-[240px] truncate whitespace-nowrap px-3 py-2.5 text-xs text-gray-400" title={item.location}>
                      {item.location || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center">
                      {gitUrl ? (
                        <a
                          href={gitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`打开 Git 源码: ${gitUrl}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      ) : (
                        <span
                          className="inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-gray-200"
                          title="该机台 Type|Model 未配置 Git 子路径映射，点击右上角「Git Source 配置」添加"
                        >
                          <Github className="h-4 w-4" />
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => navigate(`/equipment/${encodeURIComponent(eqKey)}`)}
                          title="查看详情"
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-accent-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewRequirements(item)}
                          title="查看关联需求"
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-emerald-600"
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页器 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-xs text-gray-400">
            共 {total} 台 · 第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </Button>
            {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 min-w-7 rounded-md px-1.5 text-xs tabular-nums transition-colors ${
                    p === page
                      ? 'bg-accent-600 font-medium text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 10 && <span className="px-1 text-xs text-gray-300">…</span>}
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* Git Source 配置弹窗 */}
      <Modal isOpen={isGitModalOpen} onClose={() => setIsGitModalOpen(false)} title="Git Source 配置" size="lg">
        <div className="space-y-5">
          <div className="rounded-lg bg-accent-50 p-3 text-sm text-accent-700">
            <p className="mb-1 font-medium">配置说明</p>
            <p>
              按 <b>EquipmentType | EquipmentModel</b> 区分源码，
              最终源码 URL = {gitEditBaseUrl || 'https://...'}<span className="font-mono">/[子路径]</span>
            </p>
            <p className="mt-1 text-xs text-accent-600">
              SOURCECODE 字段保留 0/1/2 产线区分功能。例：key = CPC|ASM-8350V-LPT，子路径 = cpc/asm_eagle
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Git 仓库根地址</label>
            <input
              type="url"
              value={gitEditBaseUrl}
              onChange={(e) => setGitEditBaseUrl(e.target.value)}
              className={`${inputCls} w-full`}
              placeholder="https://github.com/yourorg/yourrepo/blob/main/equipment"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Type|Model 映射表</label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const existing = new Map(gitEditMap.map((r) => [r.code, r.path]));
                    const keys = new Set<string>();
                    statsData.forEach((eq) => {
                      const k = buildGitSourceKey(eq);
                      if (k && k !== '|') keys.add(k);
                    });
                    const next = Array.from(keys).map((k) => ({ code: k, path: existing.get(k) || '' }));
                    setGitEditMap(next);
                  }}
                  title="扫描机台数据，按 EquipmentType+Model 去重生成映射行（保留已填路径）"
                >
                  <Database className="h-4 w-4" /> 从机台填充
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setGitEditMap([...gitEditMap, { code: '', path: '' }])}>
                  <Plus className="h-4 w-4" /> 新增
                </Button>
              </div>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {gitEditMap.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">暂无映射，点击「从机台填充」自动生成或「新增」手动添加</p>
              ) : (
                gitEditMap.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) => {
                        const next = [...gitEditMap];
                        next[idx] = { ...next[idx], code: e.target.value };
                        setGitEditMap(next);
                      }}
                      className={`${inputCls} w-56 font-mono`}
                      placeholder="EquipmentType|EquipmentModel"
                    />
                    <span className="text-sm text-gray-300">→</span>
                    <input
                      type="text"
                      value={row.path}
                      onChange={(e) => {
                        const next = [...gitEditMap];
                        next[idx] = { ...next[idx], path: e.target.value };
                        setGitEditMap(next);
                      }}
                      className={`${inputCls} flex-1 font-mono`}
                      placeholder="如 cpc/asm_eagle"
                    />
                    <button
                      onClick={() => setGitEditMap(gitEditMap.filter((_, i) => i !== idx))}
                      className="rounded p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="删除该映射"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          {gitEditBaseUrl && gitEditMap.filter((r) => r.code && r.path).length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                <ExternalLink className="h-3 w-3" /> 预览（首条映射）
              </p>
              <p className="break-all font-mono text-sm text-accent-600">
                {gitEditBaseUrl.replace(/\/$/, '')}/{gitEditMap.find((r) => r.code && r.path)?.path}
              </p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setIsGitModalOpen(false)}>取消</Button>
            <Button onClick={handleGitSave} loading={gitSaving}>保存配置</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
