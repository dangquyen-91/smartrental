import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Cấu hình địa chỉ backend cho mọi môi trường.
 *
 * - Khi DEV (chạy bằng Expo Go / npx expo start):
 *     Tự lấy IP của máy đang chạy Metro theo mạng hiện tại.
 *     => Đổi WiFi (trường <-> nhà) KHÔNG cần sửa gì.
 *
 * - Khi BUILD APK / lên CH Play (__DEV__ = false):
 *     Dùng PROD_API_URL (domain backend đã deploy, phải là HTTPS).
 *
 * Cách dùng:  import { API_BASE_URL } from '@/lib/config';
 */

// Port backend chạy ở local (xem PORT trong backend/.env)
const BACKEND_PORT = 5000;

// URL backend khi đã deploy thật. Sửa lại khi bạn deploy (Render/Railway/VPS...).
// LƯU Ý: phải là https:// thì bản release Android mới gọi được.
const PROD_API_URL = 'https://smartrental-be.wonderfulriver-96edf0dc.southeastasia.azurecontainerapps.io/api';

// IP dự phòng khi không tự lấy được IP từ Expo (hiếm khi xảy ra).
// Lấy IP hiện tại bằng lệnh: ipconfig  (dòng IPv4)
const FALLBACK_DEV_IP = '172.31.99.194';

/** Lấy IP của máy đang chạy Expo dev server (Metro) */
function getDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost ??
    null;

  if (!hostUri) return null;
  return hostUri.split(':')[0]; // bỏ phần port của Metro (vd :8081)
}

function resolveBaseUrl(): string {
  // Bản release (APK/Play): luôn dùng URL production
  if (!__DEV__) return PROD_API_URL;

  // Bản dev: ưu tiên IP tự lấy theo mạng hiện tại
  let host = getDevHost() ?? FALLBACK_DEV_IP;

  // Máy ảo Android: localhost = chính máy ảo, phải dùng 10.0.2.2 để gọi PC
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    host = '10.0.2.2';
  }

  return `http://${host}:${BACKEND_PORT}/api`;
}

export const API_BASE_URL = resolveBaseUrl();
