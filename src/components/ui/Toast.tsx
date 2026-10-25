import { create } from 'zustand';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (kind, message) => {
    const id = nextId++;
    set((s) => ({ items: [...s.items, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** 全局用法：toast.success('已保存') / toast.error('失败') */
export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
};

const kindStyle = {
  success: { icon: CheckCircle2, cls: 'text-emerald-500' },
  error: { icon: XCircle, cls: 'text-red-500' },
  info: { icon: Info, cls: 'text-blue-500' },
} as const;

export function Toaster() {
  const { items, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-80 flex-col gap-2">
      {items.map((t) => {
        const { icon: Icon, cls } = kindStyle[t.kind];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3.5 py-3 shadow-lg shadow-gray-900/5 animate-slide-up"
          >
            <Icon className={`mt-0.5 h-[18px] w-[18px] flex-shrink-0 ${cls}`} />
            <p className="flex-1 text-sm text-gray-700">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-gray-300 hover:text-gray-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
