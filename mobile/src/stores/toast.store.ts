import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
}

// Rung phản hồi theo loại thông báo (thành công/lỗi/thông tin)
const buzz = (type: ToastType) => {
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    error: Haptics.NotificationFeedbackType.Error,
    info: Haptics.NotificationFeedbackType.Warning,
  } as const;
  Haptics.notificationAsync(map[type]).catch(() => {});
};

export const useToastStore = create<ToastState>((set) => ({
  id: 0,
  message: '',
  type: 'info',
  show: (message, type = 'info') => {
    buzz(type);
    set((s) => ({ id: s.id + 1, message, type }));
  },
}));

// Helper gọi nhanh ở bất kỳ đâu: toast.success('...'), toast.error('...')
export const toast = {
  success: (m: string) => useToastStore.getState().show(m, 'success'),
  error: (m: string) => useToastStore.getState().show(m, 'error'),
  info: (m: string) => useToastStore.getState().show(m, 'info'),
};
