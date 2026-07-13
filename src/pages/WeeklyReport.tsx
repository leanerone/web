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
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { reportAPI, aiAPI } from '@/services/api';
import useAppStore from '@/stores/appStore';
import type { Report } from '@/types';

const mockReports: Report[] = [
  { id: 1, title: '2026年第28周工作周报', report_date: '2026-07-13', content: `## 本周工作总结

### 项目进展
1. **EAP系统升级v2.0** - 完成75%
   - 完成API接口设计文档编写
   - 数据库迁移脚本编写中
   
2. **Litho机台驱动优化** - 完成45%
   - 性能测试报告分析完成
   - 驱动代码优化进行中

### 需求处理
1. Lot Tracking功能增强 - 待处理
2. EPI机台参数调整 - 处理中
3. CMP设备驱动更新 - 处理中

### 机台上线
本周无新上机台

### 下周计划
1. 完成数据库迁移脚本
2. 继续Litho驱动优化
3. 处理Lot Tracking需求`, created_at: '2026-07-13', updated_at: '2026-07-13' },
  { id: 2, title: '2026年第27周工作周报', report_date: '2026-07-06', content: `## 本周工作总结

### 项目进展
1. **EAP系统升级v2.0** - 完成65%
   - 前端页面开发完成80%
   
2. **Litho机台驱动优化** - 完成35%
   - 需求分析完成

### 需求处理
1. CMP设备驱动更新 - 已创建

### 机台上线
1. METRO-KLA-001 上线完成`, created_at: '2026-07-06', updated_at: '2026-07-06' },
];

export default function WeeklyReport() {
  const { reports, setReports, addReport, updateReport, deleteReport } = useAppStore();
  const [reportList, setReportList] = useState<Report[]>(mockReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<Partial<Report>>({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await reportAPI.list();
        if (res.success) {
          setReportList(res.data);
          setReports(res.data);
        }
      } catch {
        setReportList(mockReports);
        setReports(mockReports);
      }
    };
    fetchReports();
  }, [setReports]);

  const filteredReports = reportList.filter((report) => {
    return report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreate = async () => {
    if (!formData.title || !formData.content) return;
    try {
      const res = await reportAPI.create(formData);
      if (res.success) {
        addReport(res.data);
        setReportList((prev) => [res.data, ...prev]);
      }
    } catch {
      const newReport: Report = {
        id: Date.now(),
        title: formData.title || '',
        report_date: new Date().toISOString().split('T')[0],
        content: formData.content || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addReport(newReport);
      setReportList((prev) => [newReport, ...prev]);
    }
    setIsCreateModalOpen(false);
    setFormData({ title: '', content: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这份周报吗？')) return;
    try {
      await reportAPI.delete(id);
      deleteReport(id);
      setReportList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      deleteReport(id);
      setReportList((prev) => prev.filter((r) => r.id !== id));
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
        setFormData({
          title: `${endDate.getFullYear()}年第${getWeekNumber(endDate)}周工作周报`,
          content: res.data.content,
        });
      }
    } catch {
      setFormData({
        title: `${new Date().getFullYear()}年第${getWeekNumber(new Date())}周工作周报`,
        content: `## 本周工作总结\n\n### 项目进展\n1. **EAP系统升级v2.0** - 完成75%\n   - 完成API接口设计文档编写\n   - 数据库迁移脚本编写中\n\n2. **Litho机台驱动优化** - 完成45%\n   - 性能测试报告分析完成\n\n### 需求处理\n1. Lot Tracking功能增强 - 待处理\n2. EPI机台参数调整 - 处理中\n3. CMP设备驱动更新 - 处理中\n\n### 机台上线\n本周无新上机台\n\n### 下周计划\n1. 完成数据库迁移脚本\n2. 继续Litho驱动优化\n3. 处理Lot Tracking需求`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  return (
    <div className="animate-fade-in">
      <div className="p-6">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="搜索周报标题或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-400 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
                />
              </div>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              新建周报
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">暂无周报记录</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                创建第一份周报
              </Button>
            </div>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} title={report.title} hover className="group">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-dark-400">
                    <Calendar className="w-4 h-4 text-primary-400" />
                    <span>报告日期: {report.report_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-400">
                    <Clock className="w-4 h-4 text-dark-500" />
                    <span>创建于: {new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-dark-300 line-clamp-4">
                    {report.content.substring(0, 200)}...
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-700">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-dark-500">
                      {report.content.split('\n').filter((line) => line.startsWith('###')).length} 个章节
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedReport(report); setIsPreviewModalOpen(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setFormData(report); setIsCreateModalOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(report.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {}}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-300 mb-1">周报标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                placeholder="例如: 2026年第28周工作周报"
              />
            </div>
            <div className="ml-4">
              <label className="block text-sm font-medium text-dark-300 mb-1">报告日期</label>
              <input
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-dark-300">周报内容</label>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleGenerateAIReport}
                loading={aiLoading}
              >
                <Sparkles className="w-4 h-4" />
                AI生成
              </Button>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none font-mono text-sm"
              rows={12}
              placeholder="请输入周报内容...\n\n建议格式：\n## 本周工作总结\n\n### 项目进展\n### 需求处理\n### 机台上线\n### 下周计划"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
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

      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => { setIsPreviewModalOpen(false); setSelectedReport(null); }} 
        title={selectedReport?.title || ''}
        size="xl"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-dark-400">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-400" />
                {selectedReport.report_date}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-dark-500" />
                创建于: {new Date(selectedReport.created_at).toLocaleString()}
              </span>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-4 whitespace-pre-wrap text-sm text-dark-200 max-h-[60vh] overflow-y-auto">
              {selectedReport.content}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
              <Button variant="ghost" onClick={() => { setIsPreviewModalOpen(false); setSelectedReport(null); }}>
                关闭
              </Button>
              <Button variant="secondary">
                <Download className="w-4 h-4" />
                导出
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}