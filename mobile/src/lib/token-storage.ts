import * as SecureStore from 'expo-secure-store';

// Tên key lưu trong SecureStore (chỉ chữ/số/.-_ là hợp lệ)
export const ACCESS_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

export const tokenStorage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
