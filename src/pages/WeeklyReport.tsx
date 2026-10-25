import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Download,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  Clock,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { reportAPI, aiAPI } from '@/services/api';
import type { Report } from '@/types';

export default function WeeklyReport() {
  const [reportList, setReportList] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<Partial<Report>>({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await reportAPI.list();
        if (res.success) {
          setReportList(res.data);
        } else {
          toast.error(res.message || '周报列表加载失败');
        }
      } catch {
        toast.error('周报列表加载失败，请检查后端服务');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reportList.filter((report) => {
    return report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.content) return;
    setLoading(true);
    try {
      if (formData.id) {
        const res = await reportAPI.update(formData.id, formData);
        if (res.success) {
          setReportList((prev) => prev.map((r) => (r.id === formData.id ? res.data : r)));
          toast.success('周报已保存');
        } else {
          toast.error(res.message || '保存失败');
        }
      } else {
        const res = await reportAPI.create(formData);
        if (res.success) {
          setReportList((prev) => [res.data, ...prev]);
          toast.success('周报已创建');
        } else {
          toast.error(res.message || '创建失败');
        }
      }
      setIsCreateModalOpen(false);
      setFormData({ title: '', content: '' });
    } catch {
      toast.error('保存失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这份周报吗？')) return;
    try {
      const res = await reportAPI.delete(id);
      if (res.success) {
        setReportList((prev) => prev.filter((r) => r.id !== id));
        toast.success('周报已删除');
      } else {
        toast.error(res.message || '删除失败');
      }
    } catch {
      toast.error('删除失败，请检查后端服务');
    }
  };

  const handleGenerateAIReport = async () => {
    setAiLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const res = await aiAPI.weeklyReport({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          title: prev.title || `${endDate.getFullYear()}年第${getWeekNumber(endDate)}周工作周报`,
          content: res.data.content,
        }));
        toast.success('AI 生成完成');
      } else {
        toast.error(res.message || 'AI 生成失败');
      }
    } catch {
      toast.error('AI 生成失败，请先在「设置 → AI」中配置并测试连接');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = (report: Report) => {
    const blob = new Blob(['\ufeff' + report.content], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${report.title || '周报'}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('已导出为 Markdown 文件');
  };

  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索周报标题或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-accent-500 focus:outline-none sm:w-64"
          />
        </div>
        <Button onClick={() => { setFormData({ title: '', content: '' }); setIsCreateModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          新建周报
        </Button>
      </div>

      {/* 周报列表 */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={searchQuery ? '没有匹配的周报' : '暂无周报记录'}
            description={searchQuery ? '换个关键词试试' : '创建第一份周报，或用 AI 一键生成'}
            action={<Button onClick={() => setIsCreateModalOpen(true)}>创建周报</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredReports.map((report) => (
            <Card key={report.id} title={report.title} hover className="group">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>报告日期: {report.report_date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>创建于: {new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {report.content.substring(0, 200)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">
                  {report.content.split('\n').filter((line) => line.startsWith('###')).length} 个章节
                </span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="sm" title="预览" onClick={() => { setSelectedReport(report); setIsPreviewModalOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="编辑" onClick={() => { setFormData(report); setIsCreateModalOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="导出 Markdown" onClick={() => handleExport(report)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="删除" onClick={() => handleDelete(report.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ title: '', content: '' });
        }}
        title={formData.id ? '编辑周报' : '新建周报'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">周报标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-800 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none"
                placeholder="例如: 2026年第28周工作周报"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">报告日期</label>
              <input
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">周报内容 *</label>
              <Button variant="secondary" size="sm" onClick={handleGenerateAIReport} loading={aiLoading}>
                <Sparkles className="h-4 w-4" />
                AI 生成
              </Button>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-mono text-sm text-gray-800 transition-colors focus:border-accent-500 focus:bg-white focus:outline-none"
              rows={12}
              placeholder={'建议格式：\n## 本周工作总结\n\n### 项目进展\n### 需求处理\n### 机台上线\n### 下周计划'}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.title || !formData.content || loading}
              loading={loading}
            >
              {formData.id ? '保存修改' : '创建周报'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => { setIsPreviewModalOpen(false); setSelectedReport(null); }}
        title={selectedReport?.title || ''}
        size="xl"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                {selectedReport.report_date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                创建于: {new Date(selectedReport.created_at).toLocaleString()}
              </span>
            </div>
            <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
              {selectedReport.content}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <Button variant="ghost" onClick={() => { setIsPreviewModalOpen(false); setSelectedReport(null); }}>
                关闭
              </Button>
              <Button variant="secondary" onClick={() => handleExport(selectedReport)}>
                <Download className="h-4 w-4" />
                导出 Markdown
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
