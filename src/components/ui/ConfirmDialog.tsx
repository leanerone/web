import { create } from 'zustand';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: ((ok: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  danger: false,
  resolve: null,
  show: (options) =>
    new Promise<boolean>((resolve) => {
      set({
        open: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '确定',
        cancelText: options.cancelText ?? '取消',
        danger: options.danger ?? false,
        resolve,
      });
    }),
  close: (ok) => {
    const { resolve } = useConfirmStore.getState();
    resolve?.(ok);
    set({ open: false, resolve: null });
  },
}));

/** 全局用法：if (await confirmAction({ title: '删除', message: '确定删除吗？', danger: true })) { ... } */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().show(options);
}

export function ConfirmDialogHost() {
  const { open, title, message, confirmText, cancelText, danger, close } = useConfirmStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/40" onClick={() => close(false)} />
      <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
            <AlertTriangle className={`h-[18px] w-[18px] ${danger ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{message}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => close(false)}>
            {cancelText}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={() => close(true)}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
