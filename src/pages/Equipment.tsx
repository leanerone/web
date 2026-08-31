import { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Search,
  Filter,
  RefreshCw,
  Database,
  Eye,
  Download,
  Github,
  Copy,
  Link2,
  Settings,
  Check,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useNavigate } from 'react-router-dom';
import { equipmentAPI, settingsAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Equipment } from '@/types';

const mockEquipment: Equipment[] = [];

// 默认 Git Source 映射 (后端 SYSTEM_SETTINGS 未加载成功时的 fallback)
const DEFAULT_GIT_BASE_URL = 'https://github.com/leanerone/web/blob/main/equipment';
const DEFAULT_GIT_SOURCE_MAP: Record<string, string> = {
  '1': 'cpc/asm_eagle',
  '2': 'pecvd/asm_trident',
  '3': 'gateox/tel_8280',
  '4': 'tteox/thermawave_op5205t',
  '5': 'cateox/asml_8350',
};

export default function Equipment() {
  const navigate = useNavigate();
  const { setEquipment } = useAppStore();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(mockEquipment);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Git Source 映射配置 (来自 SYSTEM_SETTINGS)
  const [gitBaseUrl, setGitBaseUrl] = useState<string>(DEFAULT_GIT_BASE_URL);
  const [gitSourceMap, setGitSourceMap] = useState<Record<string, string>>(DEFAULT_GIT_SOURCE_MAP);
  // Git Source 编辑弹窗
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [gitEditBaseUrl, setGitEditBaseUrl] = useState('');
  const [gitEditMap, setGitEditMap] = useState<Array<{ code: string; path: string }>>([]);
  const [gitSaving, setGitSaving] = useState(false);
  // 复制成功提示
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  /** 加载机台列表 + Git Source 映射 (并行) */
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const [eqRes, setRes] = await Promise.all([
        equipmentAPI.list({ page: 1, limit: 1000 }),
        settingsAPI.list('equipment').catch(() => ({ success: false, data: [] as any[] })),
      ]);
      if (eqRes.success) {
        setEquipmentList(eqRes.data);
        setEquipment(eqRes.data);
      }
      // 解析 system_settings 中 equipment 分类
      if (setRes.success && Array.isArray(setRes.data)) {
        const baseRow = setRes.data.find((s: any) => s.key === 'git_source_base_url');
        const mapRow  = setRes.data.find((s: any) => s.key === 'git_source_map');
        if (baseRow?.value) setGitBaseUrl(baseRow.value);
        if (mapRow?.value) {
          try { setGitSourceMap(JSON.parse(mapRow.value)); } catch { /* 保持默认 */ }
        }
      }
    } catch {
      setEquipmentList(mockEquipment);
      setEquipment(mockEquipment);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [setEquipment]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEquipment();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = () => {
    const headers = ['机台编号','机台类型','机台型号','厂区','产线','CC服务器','负责人','操作系统','服务器类型','SOURCE源码分类','状态','位置','GitURL'];
    const rows = filteredEquipment.map(item => [
      item.eq_name, item.eq_type, item.eq_model, item.area, (item as any).line ?? '',
      item.server_id, (item as any).chargeman ?? '', (item as any).os ?? '', item.driver_type,
      (item as any).source_code ?? '', item.status, item.location, buildGitUrl(item as any),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `equipment_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  /** 根据 SOURCECODE 拼接 Git URL */
  const buildGitUrl = (item: Equipment): string => {
    const sc = String((item as any).source_code ?? '').trim();
    if (!sc) return '';
    const sub = gitSourceMap[sc];
    if (!sub) return '';
    return `${gitBaseUrl.replace(/\/$/, '')}/${sub}`;
  };

  /** 复制机台编号到剪贴板 */
  const handleCopyCode = async (item: Equipment) => {
    const text = item.eq_name || item.equipment || String(item.id);
    const key = String(item.equipment ?? item.id ?? item.eq_name);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      console.error('复制失败:', err);
      // fallback: 用 textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  /** 跳转到该机台关联的需求列表 */
  const handleViewRequirements = (item: Equipment) => {
    const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
    navigate(`/requirements?equipment=${encodeURIComponent(eqKey)}`);
  };

  /** 打开 Git Source 配置弹窗，初始化编辑数据 */
  const openGitModal = () => {
    setGitEditBaseUrl(gitBaseUrl);
    setGitEditMap(Object.entries(gitSourceMap).map(([code, path]) => ({ code, path })));
    setIsGitModalOpen(true);
  };

  /** 保存 Git Source 配置到后端 SYSTEM_SETTINGS */
  const handleGitSave = async () => {
    setGitSaving(true);
    try {
      // 过滤空行
      const filtered = gitEditMap.filter((r) => r.code.trim() && r.path.trim());
      const newMap: Record<string, string> = {};
      filtered.forEach((r) => { newMap[r.code.trim()] = r.path.trim(); });
      const baseUrl = gitEditBaseUrl.trim() || DEFAULT_GIT_BASE_URL;
      // 并行保存 base_url 和 map
      await Promise.all([
        settingsAPI.update('git_source_base_url', baseUrl, 'Git Source 根地址', 'equipment'),
        settingsAPI.update('git_source_map', JSON.stringify(newMap), 'SOURCECODE -> Git 子路径映射', 'equipment'),
      ]);
      setGitBaseUrl(baseUrl);
      setGitSourceMap(newMap);
      setIsGitModalOpen(false);
    } catch (err) {
      console.error('保存 Git Source 配置失败:', err);
      alert('保存失败，请重试');
    } finally {
      setGitSaving(false);
    }
  };

  // 获取所有机型用于筛选
  const equipmentTypes = useMemo(
    () => [...new Set(equipmentList.map(e => e.eq_type).filter(Boolean))],
    [equipmentList],
  );

  const filteredEquipment = useMemo(() => equipmentList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      item.eq_name.toLowerCase().includes(q) ||
      item.ap_name.toLowerCase().includes(q) ||
      item.eq_model.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.server_id.toLowerCase().includes(q) ||
      ((item as any).chargeman ?? '').toLowerCase().includes(q) ||
      ((item as any).source_code ?? '').includes(q);
    const matchesType   = typeFilter === 'all'   || item.eq_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [equipmentList, searchQuery, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: 'bg-green-50 text-green-600',
      offline: 'bg-red-50 text-red-600',
      maintenance: 'bg-orange-50 text-orange-600',
      decommissioned: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      online: '在线',
      offline: '离线',
      maintenance: '维护中',
      decommissioned: '已退役',
    };
    return labels[status] || status;
  };

  const COL_COUNT = 14;  // 表头列数 (用于骨架屏 & 空表 colSpan)

  return (
    <div className="animate-fade-in">
      <div className="p-6">
        {/* 数据来源提示 */}
        <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-start gap-2">
          <Database className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-cyan-700">
            <p className="font-medium">机台数据来源说明：</p>
            <p>量产环境：后端 ORM 直接映射 <code className="bg-white px-1 rounded border border-cyan-200">PANJOB.EQUIPMENTINFO</code> 量产表 (用 PANJOB 账号直连)，前端只读展示，不会修改量产数据。</p>
            <p>主键: <code>EQUIPMENT</code> (机台编号) ｜ 状态: 由 OS 字段派生 (Win → 在线, 其他 → 维护, NULL → 离线)</p>
          </div>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索机台编号/类型/型号/CC服务器/负责人/SOURCECODE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 w-full sm:w-96"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-cyan-500 appearance-none w-full sm:w-44"
                >
                  <option value="all">全部机台类型</option>
                  {equipmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-cyan-500 appearance-none w-full sm:w-36"
              >
                <option value="all">全部状态</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="maintenance">维护中</option>
                <option value="decommissioned">已退役</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleRefresh} loading={refreshing}>
                <RefreshCw className="w-4 h-4" />
                刷新
              </Button>
              <Button variant="secondary" onClick={handleExport}>
                <Download className="w-4 h-4" />
                导出CSV
              </Button>
              <Button variant="secondary" onClick={openGitModal}>
                <Settings className="w-4 h-4" />
                Git Source 配置
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-x-auto" title={`机台列表 (共 ${filteredEquipment.length} 台)`}>
          <table className="w-full min-w-[1600px]">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-3 whitespace-nowrap">机台编号</th>
                <th className="py-3 px-3 whitespace-nowrap">类型</th>
                <th className="py-3 px-3 whitespace-nowrap">型号</th>
                <th className="py-3 px-3 whitespace-nowrap">厂区</th>
                <th className="py-3 px-3 whitespace-nowrap">产线</th>
                <th className="py-3 px-3 whitespace-nowrap">CC服务器</th>
                <th className="py-3 px-3 whitespace-nowrap">负责人</th>
                <th className="py-3 px-3 whitespace-nowrap">操作系统</th>
                <th className="py-3 px-3 whitespace-nowrap">服务器类型</th>
                <th className="py-3 px-3 whitespace-nowrap">SOURCE</th>
                <th className="py-3 px-3 whitespace-nowrap">状态</th>
                <th className="py-3 px-3 whitespace-nowrap">位置</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">源码</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(COL_COUNT)].map((_, j) => (
                      <td key={j} className="py-3 px-3">
                        <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredEquipment.length === 0 ? (
                <tr className="border-b border-gray-100">
                  <td colSpan={COL_COUNT} className="py-12 text-center">
                    <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">暂无机台记录（确认后端 EQUIPMENT 视图或表是否有数据）</p>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item) => {
                  const gitUrl = buildGitUrl(item as any);
                  const eqKey = String(item.equipment ?? item.id ?? item.eq_name);
                  const isCopied = copiedKey === eqKey;
                  return (
                    <tr key={eqKey} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-sm font-medium text-cyan-600 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {item.eq_name}
                          <button
                            onClick={() => handleCopyCode(item)}
                            title="复制机台编号"
                            className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">{item.eq_type}</td>
                      <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">{item.eq_model}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{item.area || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{(item as any).line || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap font-mono">{item.server_id || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{(item as any).chargeman || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{(item as any).os || '-'}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{item.driver_type || '-'}</td>
                      <td className="py-3 px-3 text-sm whitespace-nowrap">
                        {(item as any).source_code ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                            SOURCE={(item as any).source_code}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'online' ? 'bg-green-500' : item.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'}`} />
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap max-w-[280px] truncate" title={item.location}>{item.location || '-'}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {gitUrl ? (
                          <a
                            href={gitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`打开 Git 源码: ${gitUrl}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sky-600 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="inline-block w-8 h-8 rounded-md bg-gray-50 text-gray-300 flex items-center justify-center cursor-not-allowed" title="无 SOURCECODE 或未配置映射，点击右上角'Git Source 配置'添加映射">
                            <Github className="w-4 h-4 opacity-40" />
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/equipment/${encodeURIComponent(eqKey)}`)} title="查看详情">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <button
                            onClick={() => handleViewRequirements(item)}
                            title="查看关联需求"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>

        <div className="mt-6">
          <Card title="机台统计">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="p-4 bg-cyan-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-600">{equipmentList.length}</p>
                <p className="text-sm text-gray-600 mt-1">机台总数</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{equipmentList.filter(e => e.status === 'online').length}</p>
                <p className="text-sm text-gray-600 mt-1">在线</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{equipmentList.filter(e => e.status === 'maintenance').length}</p>
                <p className="text-sm text-gray-600 mt-1">维护中</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{equipmentList.filter(e => e.status === 'offline').length}</p>
                <p className="text-sm text-gray-600 mt-1">离线</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{equipmentTypes.length}</p>
                <p className="text-sm text-gray-600 mt-1">机型数</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-violet-600">{equipmentList.filter(e => (e as any).source_code).length}</p>
                <p className="text-sm text-gray-600 mt-1">有源码映射</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Git Source 配置弹窗 */}
      <Modal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        title="Git Source 配置"
      >
        <div className="space-y-5">
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-sm text-cyan-700">
            <p className="font-medium mb-1">配置说明</p>
            <p>SOURCECODE → Git 子路径映射，最终源码 URL = {gitEditBaseUrl || 'https://...'}<span className="text-violet-600">/[子路径]</span></p>
            <p className="mt-1 text-xs text-cyan-600">例：base = https://github.com/foo/web/blob/main/equipment，子路径 = cpc/asm_eagle → 源码 = base/cpc/asm_eagle</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Git 仓库根地址</label>
            <input
              type="url"
              value={gitEditBaseUrl}
              onChange={(e) => setGitEditBaseUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="https://github.com/yourorg/yourrepo/blob/main/equipment"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">SOURCECODE 映射表</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGitEditMap([...gitEditMap, { code: '', path: '' }])}
              >
                <Plus className="w-4 h-4" />
                新增映射
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gitEditMap.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">暂无映射，点击"新增映射"</p>
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
                      className="w-24 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="如 1"
                    />
                    <span className="text-gray-400 text-sm">→</span>
                    <input
                      type="text"
                      value={row.path}
                      onChange={(e) => {
                        const next = [...gitEditMap];
                        next[idx] = { ...next[idx], path: e.target.value };
                        setGitEditMap(next);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="如 cpc/asm_eagle"
                    />
                    <button
                      onClick={() => setGitEditMap(gitEditMap.filter((_, i) => i !== idx))}
                      className="inline-flex items-center justify-center w-8 h-8 rounded text-red-500 hover:bg-red-50 transition-colors"
                      title="删除该映射"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          {gitEditBaseUrl && gitEditMap.filter((r) => r.code && r.path).length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                预览（首条映射）
              </p>
              <p className="text-sm font-mono text-sky-600 break-all">
                {gitEditBaseUrl.replace(/\/$/, '')}/{gitEditMap.find((r) => r.code && r.path)?.path}
              </p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsGitModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleGitSave} disabled={gitSaving}>
              {gitSaving ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
