import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import PressableScale from '@/components/ui/pressable-scale';
import { useContract, useSignContract } from '@/hooks/use-contracts';
import { openContractPdf, shareContractPdf } from '@/lib/contract-pdf';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import type { ContractParty } from '@/types/contract';

const partyId = (p: ContractParty | string) => (typeof p === 'object' ? p.id : p);
const partyName = (p: ContractParty | string) => (typeof p === 'object' ? p.name : undefined);
const money = (v?: number | null) => (v != null ? `${v.toLocaleString('vi-VN')}đ` : null);

export default function ContractDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: c, isLoading } = useContract(id);
  const sign = useSignContract();
  const [opening, setOpening] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (isLoading || !c) {
    return (
      <SafeAreaView style={styles.center}>
        {isLoading ? <ActivityIndicator color={colors.brand} /> : <Text>Không tìm thấy hợp đồng.</Text>}
      </SafeAreaView>
    );
  }

  const myId = user?.id;
  const isTenant = !!myId && myId === partyId(c.tenant);
  const isLandlord = !!myId && myId === partyId(c.landlord);
  const mySideSigned = isTenant
    ? c.signedByTenant?.signed
    : isLandlord
      ? c.signedByLandlord?.signed
      : true;
  const canSign =
    (isTenant || isLandlord) && !mySideSigned && c.status !== 'cancelled' && c.status !== 'signed';

  const onSign = () =>
    Alert.alert('Ký hợp đồng', 'Bạn xác nhận ký hợp đồng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Ký',
        onPress: () =>
          sign.mutate(c.id, {
            onSuccess: () => toast.success('Bạn đã ký hợp đồng'),
            onError: (e) =>
              Alert.alert(
                'Lỗi',
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                  'Ký thất bại',
              ),
          }),
      },
    ]);

  const onOpen = async () => {
    setOpening(true);
    try {
      await openContractPdf(c.id);
    } catch {
      Alert.alert('Lỗi', 'Không mở được PDF. Thử lại sau.');
    } finally {
      setOpening(false);
    }
  };

  const onShare = async () => {
    setSharing(true);
    try {
      await shareContractPdf(c.id);
    } catch {
      Alert.alert('Lỗi', 'Không tải được PDF. Thử lại sau.');
    } finally {
      setSharing(false);
    }
  };

  const property = typeof c.property === 'object' ? c.property : undefined;
  const propId = (property as { id?: string } | undefined)?.id ?? (typeof c.property === 'string' ? c.property : undefined);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Hợp đồng thuê</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Phòng */}
        <PressableScale
          style={styles.card}
          haptic
          disabled={!propId}
          onPress={() => propId && router.push({ pathname: '/properties/[id]', params: { id: propId } })}
        >
          <Text style={styles.cardLabel}>Bất động sản</Text>
          <Text style={styles.propTitle}>{property?.title ?? '—'}</Text>
          {property?.address && (
            <Text style={styles.muted}>
              {property.address.district}, {property.address.city}
            </Text>
          )}
          {!!propId && (
            <View style={styles.viewMore}>
              <Text style={styles.viewMoreText}>Xem chi tiết phòng</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.brand} />
            </View>
          )}
        </PressableScale>

        {/* Các bên */}
        <View style={styles.card}>
          <Row label="Chủ nhà" value={partyName(c.landlord) ?? '—'} />
          <Row label="Người thuê" value={partyName(c.tenant) ?? '—'} />
        </View>

        {/* Điều khoản & chi phí */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Điều khoản & chi phí</Text>
          {!!c.terms && <Text style={styles.terms}>{c.terms}</Text>}
          {money(c.electricityPrice) && <Row label="Giá điện" value={`${money(c.electricityPrice)}/kWh`} />}
          {money(c.waterPrice) && <Row label="Giá nước" value={`${money(c.waterPrice)}/người`} />}
          {!!c.paymentMethod && <Row label="Thanh toán" value={c.paymentMethod} />}
          {!c.terms && !c.electricityPrice && !c.waterPrice && !c.paymentMethod && (
            <Text style={styles.muted}>Không có điều khoản bổ sung.</Text>
          )}
        </View>

        {/* Trạng thái ký */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Trạng thái ký</Text>
          <SignRow label="Chủ nhà" signed={c.signedByLandlord?.signed} />
          <SignRow label="Người thuê" signed={c.signedByTenant?.signed} />

          {c.status === 'signed' ? (
            <View style={styles.signedBanner}>
              <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
              <Text style={styles.signedText}>Hợp đồng đã có hiệu lực (cả 2 bên đã ký)</Text>
            </View>
          ) : c.status === 'cancelled' ? (
            <View style={styles.warnBanner}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={[styles.bannerText, { color: colors.danger }]}>Hợp đồng đã bị hủy</Text>
            </View>
          ) : mySideSigned ? (
            <View style={styles.warnBanner}>
              <Ionicons name="time-outline" size={16} color="#d97706" />
              <Text style={[styles.bannerText, { color: '#d97706' }]}>
                Bạn đã ký. Đang chờ {isTenant ? 'chủ nhà' : 'người thuê'} ký để hợp đồng có hiệu lực.
              </Text>
            </View>
          ) : (isTenant || isLandlord) ? (
            <View style={styles.warnBanner}>
              <Ionicons name="create-outline" size={16} color={colors.brand} />
              <Text style={[styles.bannerText, { color: colors.brand }]}>
                Hợp đồng chờ bạn ký. Cần cả 2 bên ký mới có hiệu lực.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        {canSign && (
          <Pressable style={styles.signBtn} disabled={sign.isPending} onPress={onSign}>
            {sign.isPending ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={styles.signBtnText}>Ký hợp đồng</Text>
            )}
          </Pressable>
        )}

        <Pressable style={styles.openBtn} disabled={opening} onPress={onOpen}>
          {opening ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color={colors.accentText} />
              <Text style={styles.openText}>Mở PDF</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.pdfBtn} disabled={sharing} onPress={onShare}>
          {sharing ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <>
              <Ionicons name="share-outline" size={18} color={colors.brand} />
              <Text style={styles.pdfText}>Tải / chia sẻ PDF</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function SignRow({ label, signed }: { label: string; signed?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.signStatus}>
        <Ionicons
          name={signed ? 'checkmark-circle' : 'time-outline'}
          size={16}
          color={signed ? '#16a34a' : '#d97706'}
        />
        <Text style={[styles.rowValue, { color: signed ? '#16a34a' : '#d97706' }]}>
          {signed ? 'Đã ký' : 'Chưa ký'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  cardLabel: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  viewMore: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  viewMoreText: { fontSize: 13, fontWeight: '700', color: colors.brand },
  propTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  terms: { fontSize: 14, color: colors.text, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  signStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a18',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  signedText: { fontSize: 13, color: '#16a34a', fontWeight: '600', flex: 1 },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  signBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
  signBtnText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
  openBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  openText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
  pdfBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
  },
  pdfText: { fontSize: 15, fontWeight: '700', color: colors.brand },
});
