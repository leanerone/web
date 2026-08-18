import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  RefreshCw,
  Database,
  Eye,
  Download,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useNavigate } from 'react-router-dom';
import { equipmentAPI } from '@/services/api';
import { mockEquipment } from '@/utils/mockData';
import useAppStore from '@/stores/appStore';
import type { Equipment } from '@/types';

export default function Equipment() {
  const navigate = useNavigate();
  const { setEquipment } = useAppStore();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(mockEquipment);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await equipmentAPI.list({ limit: 1000 });
      if (res.success) {
        setEquipmentList(res.data);
        setEquipment(res.data);
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
    const headers = ['AP_ID', 'AP_NAME', 'EQ_NAME', 'EQ_TYPE', 'EQ_MODEL', 'VENDOR', 'SERVER_ID', 'DRIVER_TYPE', 'DRIVER_VERSION', 'SNMP_IP', 'SNMP_PORT', 'DRIVER1_IP', 'DRIVER1_PORT', 'AREA', 'STATUS', 'LOCATION'];
    const rows = filteredEquipment.map(item => [
      item.ap_id, item.ap_name, item.eq_name, item.eq_type, item.eq_model, item.vendor,
      item.server_id, item.driver_type, item.driver_version, item.snmp_ip, item.snmp_port,
      item.driver1_ip, item.driver1_port, item.area, item.status, item.location
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `equipment_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 获取所有机型用于筛选
  const equipmentTypes = [...new Set(equipmentList.map(e => e.eq_type))];

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.eq_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ap_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.eq_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.eq_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

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

  return (
    <div className="animate-fade-in">
      <div className="p-6">
        {/* 数据来源提示 */}
        <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-600 flex-shrink-0" />
          <p className="text-sm text-cyan-700">
            机台数据来源于 <span className="font-medium">Oracle生产数据库</span>，以量产数据为准，仅支持查看和导出。
          </p>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索机台名称、AP名称、型号或厂商..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 w-full sm:w-72"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-cyan-500 appearance-none w-full sm:w-40"
                >
                  <option value="all">全部机型</option>
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
                刷新数据
              </Button>
              <Button variant="secondary" onClick={handleExport}>
                <Download className="w-4 h-4" />
                导出CSV
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="pb-3 pt-3 px-4">AP_ID</th>
                <th className="pb-3 pt-3 px-4">AP_NAME</th>
                <th className="pb-3 pt-3 px-4">EQ_NAME</th>
                <th className="pb-3 pt-3 px-4">EQ_TYPE</th>
                <th className="pb-3 pt-3 px-4">EQ_MODEL</th>
                <th className="pb-3 pt-3 px-4">VENDOR</th>
                <th className="pb-3 pt-3 px-4">SERVER_ID</th>
                <th className="pb-3 pt-3 px-4">DRIVER_VER</th>
                <th className="pb-3 pt-3 px-4">AREA</th>
                <th className="pb-3 pt-3 px-4">STATUS</th>
                <th className="pb-3 pt-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(11)].map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredEquipment.length === 0 ? (
                <tr className="border-b border-gray-100">
                  <td colSpan={11} className="py-12 text-center">
                    <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">暂无机台记录</p>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.ap_id}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{item.ap_name}</td>
                    <td className="py-3 px-4 text-sm font-medium text-cyan-600">{item.eq_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.eq_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.eq_model}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.vendor}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.server_id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.driver_version}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.area}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'online' ? 'bg-green-500' : item.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'}`} />
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/equipment/${item.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <div className="mt-6">
          <Card title="机型统计">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-cyan-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-600">{equipmentList.length}</p>
                <p className="text-sm text-gray-600 mt-1">机台总数</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{equipmentList.filter(e => e.status === 'online').length}</p>
                <p className="text-sm text-gray-600 mt-1">在线机台</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{equipmentList.filter(e => e.status === 'maintenance').length}</p>
                <p className="text-sm text-gray-600 mt-1">维护中</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{equipmentList.filter(e => e.status === 'offline').length}</p>
                <p className="text-sm text-gray-600 mt-1">离线机台</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{equipmentTypes.length}</p>
                <p className="text-sm text-gray-600 mt-1">机型种类</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
