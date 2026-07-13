import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Monitor, Loader2, ShieldCheck, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithWindows, loginWithUsername, isLoading, error, clearError } = useAuthStore();
  const [showManual, setShowManual] = useState(false);
  const [username, setUsername] = useState('');

  // 进入页面自动尝试Windows SSO
  useEffect(() => {
    let mounted = true;
    const autoLogin = async () => {
      const ok = await loginWithWindows();
      if (ok && mounted) {
        navigate('/dashboard');
      }
    };
    autoLogin();
    return () => { mounted = false; };
  }, [navigate, loginWithWindows]);

  const handleWindowsLogin = async () => {
    clearError();
    const ok = await loginWithWindows();
    if (ok) navigate('/dashboard');
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    clearError();
    const ok = await loginWithUsername(username.trim());
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl shadow-2xl shadow-cyan-500/30 mb-4">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CIM Work Manager</h1>
          <p className="text-cyan-200/80 text-sm">半导体CIM EAP工程师工作管理平台</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* Windows SSO 区域 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 text-cyan-300">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Windows域认证SSO</span>
            </div>

            <button
              onClick={handleWindowsLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在认证...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  使用Windows账户登录
                </>
              )}
            </button>

            <p className="mt-3 text-xs text-cyan-200/60 text-center">
              点击按钮将自动继承当前Windows登录会话，无需输入密码
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-400/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/10 backdrop-blur-xl px-3 text-xs text-cyan-200/70">
                或使用用户名登录
              </span>
            </div>
          </div>

          {/* 手动登录区域 */}
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/20 text-cyan-100 text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              手动输入用户名
              <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <form onSubmit={handleManualLogin} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入Windows用户名"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-cyan-200/40 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    登录
                  </>
                )}
              </button>
            </form>
          )}

          {/* 快捷用户列表 */}
          {showManual && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-cyan-200/60 mb-2">快捷用户：</p>
              <div className="flex flex-wrap gap-2">
                {['administrator', 'eap.engineer', 'cim.user'].map((u) => (
                  <button
                    key={u}
                    onClick={() => setUsername(u)}
                    className="px-3 py-1 text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-cyan-100 rounded-full transition-colors"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="mt-6 text-center text-xs text-cyan-200/50">
          <p>企业内网环境 · Windows域认证 · 自动单点登录</p>
          <p className="mt-1">© 2026 CIM Work Manager</p>
        </div>
      </div>
    </div>
  );
}
