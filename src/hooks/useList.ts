import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/Toast';
import type { APIResponse } from '@/types';

/** 值防抖（搜索框等场景） */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * 列表数据统一管理：服务端筛选/分页 + 刷新 + 统一错误提示。
 * params 变化（序列化后比较）自动重新拉取。
 */
export function useList<T, P extends Record<string, unknown>>(
  fetcher: (params: P) => Promise<APIResponse<T[]>>,
  params: P
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const paramsKey = JSON.stringify(params);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcherRef.current(JSON.parse(paramsKey) as P);
      if (res.success) {
        setData(res.data);
        setTotal(res.total ?? res.data.length);
      } else {
        toast.error(res.message || '列表加载失败');
      }
    } catch {
      toast.error('列表加载失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, total, loading, refresh, setData };
}
