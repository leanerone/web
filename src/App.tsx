import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Equipment from '@/pages/Equipment';
import Requirements from '@/pages/Requirements';
import RequirementDetail from '@/pages/RequirementDetail';
import AIAssistant from '@/pages/AIAssistant';
import WeeklyReport from '@/pages/WeeklyReport';
import Profile from '@/pages/Profile';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import WorkItems from '@/pages/WorkItems';
import { useAuthStore } from '@/stores/authStore';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: '仪表盘', subtitle: '工作概览与统计' },
  '/dashboard': { title: '仪表盘', subtitle: '工作概览与统计' },
  '/work-items': { title: '工作管理', subtitle: '管理日常工作项目' },
  '/projects': { title: '项目管理', subtitle: '项目进度与任务跟踪' },
  '/projects/:id': { title: '项目详情', subtitle: '项目规划与任务管理' },
  '/equipment': { title: '机台管理', subtitle: '设备状态与配置管理' },
  '/equipment/:equipmentName': { title: '机台详情', subtitle: '设备详细信息' },
  '/requirements': { title: '需求管理', subtitle: '用户需求与变更记录' },
  '/requirements/:id': { title: '需求详情', subtitle: '需求详细信息' },
  '/ai-assistant': { title: 'AI规划助手', subtitle: '智能工作规划' },
  '/weekly-report': { title: '周报管理', subtitle: '周报生成与历史记录' },
  '/profile': { title: '个人资料', subtitle: '用户信息与系统设置' },
  '/users': { title: '用户管理', subtitle: '用户与权限管理' },
  '/settings': { title: '系统设置', subtitle: '系统配置与集成' },
};

function PageContent() {
  const location = useLocation();
  const path = location.pathname;
  let pageInfo = pageTitles[path];

  if (!pageInfo) {
    const basePath = path.split('/')[1] ? `/${path.split('/')[1]}` : '/';
    pageInfo = pageTitles[basePath] || { title: 'CIM Manager' };
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden ml-64">
      <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/work-items" element={<WorkItems />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/requirements/:id" element={<RequirementDetail />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedApp() {
  const { isAuthenticated, initialize } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initialize();
    setInitialized(true);
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
