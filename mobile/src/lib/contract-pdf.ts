import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '@/lib/config';
import { useAuthStore } from '@/stores/auth.store';

// Tải PDF hợp đồng (kèm token auth) về thư mục app, trả về fileUri local.
async function fetchContractPdf(contractId: string) {
  const token = useAuthStore.getState().accessToken;
  const fileUri = `${FileSystem.documentDirectory}hop-dong-${contractId}.pdf`;

  const res = await FileSystem.downloadAsync(
    `${API_BASE_URL}/contracts/${contractId}/pdf`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );
  if (res.status !== 200) throw new Error('Tải PDF thất bại');
  return res.uri;
}

// Mở PDF xem ngay bằng print-preview của hệ thống (Android/iOS) — không qua bảng chia sẻ.
export async function openContractPdf(contractId: string) {
  const uri = await fetchContractPdf(contractId);
  await Print.printAsync({ uri });
  return uri;
}

// Tải PDF rồi mở bảng chia sẻ (lưu Drive, gửi mail, lưu file...).
export async function shareContractPdf(contractId: string) {
  const uri = await fetchContractPdf(contractId);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Hợp đồng thuê' });
  }
  return uri;
}
