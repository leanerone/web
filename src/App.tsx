import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import { Toaster } from '@/components/ui/Toast';
import { ConfirmDialogHost } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import useAppStore, { applyTheme } from '@/stores/appStore';

// 非首屏页面全部懒加载，避免 14 个页面全部打进首屏 bundle
const Projects = lazy(() => import('@/pages/Projects'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const Equipment = lazy(() => import('@/pages/Equipment'));
const EquipmentDetail = lazy(() => import('@/pages/EquipmentDetail'));
const Requirements = lazy(() => import('@/pages/Requirements'));
const RequirementDetail = lazy(() => import('@/pages/RequirementDetail'));
const AIAssistant = lazy(() => import('@/pages/AIAssistant'));
const WeeklyReport = lazy(() => import('@/pages/WeeklyReport'));
const Settings = lazy(() => import('@/pages/Settings'));
const WorkItems = lazy(() => import('@/pages/WorkItems'));

function PageFallback() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-accent-500" />
    </div>
  );
}

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: '仪表盘', subtitle: '工作概览与统计' },
  '/dashboard': { title: '仪表盘', subtitle: '工作概览与统计' },
  '/work-items': { title: '工作台', subtitle: '日常工作项管理' },
  '/projects': { title: '项目', subtitle: '项目进度与任务跟踪' },
  '/projects/:id': { title: '项目详情', subtitle: '项目规划与任务管理' },
  '/equipment': { title: '机台', subtitle: '量产设备数据查询' },
  '/equipment/:equipmentName': { title: '机台详情', subtitle: '设备详细信息' },
  '/requirements': { title: '需求', subtitle: '用户需求与变更记录' },
  '/requirements/:id': { title: '需求详情', subtitle: '需求详细信息' },
  '/ai-assistant': { title: 'AI规划助手', subtitle: '智能工作规划' },
  '/weekly-report': { title: '周报', subtitle: '周报生成与历史记录' },
  '/profile': { title: '个人资料', subtitle: '用户信息与系统设置' },
  '/users': { title: '用户', subtitle: '用户与权限管理' },
  '/settings': { title: '设置', subtitle: '系统配置与集成' },
};

function PageContent() {
  const location = useLocation();
  const path = location.pathname;
  let pageInfo = pageTitles[path];

  if (!pageInfo) {
    const basePath = path.split('/')[1] ? `/${path.split('/')[1]}` : '/';
    pageInfo = pageTitles[basePath] || { title: 'CIM Manager' };
  }

  const { sidebarCollapsed } = useAppStore();

  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      }`}
    >
      <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/work-items" element={<WorkItems />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/equipment/:equipmentName" element={<EquipmentDetail />} />
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/requirements/:id" element={<RequirementDetail />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/weekly-report" element={<WeeklyReport />} />
            <Route path="/profile" element={<Navigate to="/settings?tab=account" replace />} />
            <Route path="/users" element={<Navigate to="/settings?tab=members" replace />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function ProtectedApp() {
  const { isAuthenticated, initialize } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    applyTheme(useAppStore.getState().theme);
    initialize();
    setInitialized(true);
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <PageContent />
      <CommandPalette />
      <Toaster />
      <ConfirmDialogHost />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Router>
  );
}

export default App;
