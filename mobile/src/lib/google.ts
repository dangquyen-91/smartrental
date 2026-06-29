import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Web OAuth Client ID (dùng chung với frontend web).
// Lấy ở Google Cloud Console > Credentials > OAuth 2.0 Client (loại Web).
export const GOOGLE_WEB_CLIENT_ID =
  '583041981620-bijinsmhcrb1apr9dpc7bq6lhedsotg4.apps.googleusercontent.com';

// Gọi 1 lần khi app khởi động (trong app/_layout.tsx)
export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });
}
