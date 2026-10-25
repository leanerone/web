import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Cpu, RefreshCw, ClipboardCopy, Check, FileSearch } from 'lucide-react';
import { equipmentAPI } from '@/services/api';
import type { Equipment } from '@/types';
import { EquipmentStatusBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function EquipmentDetail() {
  const { equipmentName } = useParams<{ equipmentName: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchDetail = async () => {
    if (!equipmentName) return;
    setLoading(true);
    try {
      const res = await equipmentAPI.get(equipmentName);
      if (res.success) setItem(res.data);
      else toast.error(res.message || '机台详情加载失败');
    } catch {
      toast.error('机台详情加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentName]);

  const handleCopy = async () => {
    if (!item) return;
    const name = item.equipment || item.eq_name || '';
    try {
      await navigator.clipboard.writeText(name);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = name;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success('机台编号已复制');
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <EmptyState
        icon={Cpu}
        title="未找到该机台"
        description={`机台编号「${equipmentName}」不存在或已被移除`}
        action={<Button onClick={() => navigate('/equipment')}>返回机台列表</Button>}
      />
    );
  }

  const name = item.equipment || item.eq_name || '-';

  const basicInfo: [string, string][] = [
    ['机台编号', name],
    ['机台类型', item.equipment_type || item.eq_type || '-'],
    ['机台型号', item.equipment_model || item.eq_model || '-'],
    ['厂商', item.vendor || '-'],
    ['产线', item.line || item.area || '-'],
    ['负责人', item.chargeman || '-'],
  ];

  const networkInfo: [string, string][] = [
    ['CC Server', item.cc_server || item.server_id || '-'],
    ['Moxa', item.moxa || '-'],
    ['NPort', item.nport || '-'],
    ['NPort IP', item.nport_ip || '-'],
    ['NPort COM', item.nport_com || '-'],
    ['OS', item.os || '-'],
    ['Server Type', item.srv_type || '-'],
    ['Git Source 码', item.source_code || '-'],
  ];

  const smifInfo: [string, string][] = [
    ['SMIF1 NPort IP', item.smif1_nport_ip || '-'],
    ['SMIF2 NPort IP', item.smif2_nport_ip || '-'],
    ['SMIF3 NPort IP', item.smif3_nport_ip || '-'],
    ['SMIF4 NPort IP', item.smif4_nport_ip || '-'],
  ];

  const InfoCard = ({ title, rows }: { title: string; rows: [string, string][] }) => (
    <Card title={title}>
      <dl className="divide-y divide-gray-50">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2 text-sm">
            <dt className="text-gray-400">{k}</dt>
            <dd className="ml-4 truncate text-right font-medium text-gray-700">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/equipment')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="返回机台列表"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
              <EquipmentStatusBadge status={item.status} />
              <button
                onClick={handleCopy}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="复制机台编号"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <ClipboardCopy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              {item.equipment_type || item.eq_type || '—'} · {item.equipment_model || item.eq_model || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchDetail}>
            <RefreshCw className="h-4 w-4" /> 刷新
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/requirements?equipment=${encodeURIComponent(name)}`)}>
            <FileSearch className="h-4 w-4" /> 关联需求
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InfoCard title="基本信息" rows={basicInfo} />
        <InfoCard title="网络与服务" rows={networkInfo} />
        <InfoCard title="SMIF 通道" rows={smifInfo} />
      </div>
    </div>
  );
}
