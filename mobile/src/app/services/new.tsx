import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { SERVICE_ICON } from '@/constants/service-meta';
import { formatPrice } from '@/lib/format';
import { useServiceCatalog, useCreateServiceOrder } from '@/hooks/use-services';
import { useMyBookings } from '@/hooks/use-bookings';
import { useMyListings } from '@/hooks/use-properties';
import { useAuthStore } from '@/stores/auth.store';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { toast } from '@/stores/toast.store';
import type { ServiceType } from '@/types/service';

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
// Dải giờ gợi ý: 06:00 → 22:00, mỗi 30 phút (vẫn cho chọn giờ bất kỳ qua nút "Khác")
const TIMES = Array.from({ length: (22 - 6) * 2 + 1 }, (_, i) => 6 * 60 + i * 30);
const fmtTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const midnight = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const sameDay = (a: Date, b: Date) => midnight(a).getTime() === midnight(b).getTime();

interface PropOption {
  id: string;
  title: string;
}

export default function NewServiceOrder() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: ServiceType }>();
  const role = useAuthStore((s) => s.user?.role);
  const isLandlord = role === 'landlord';

  const { data: catalog } = useServiceCatalog();
  const item = catalog?.find((c) => c.type === type);

  const bookings = useMyBookings();
  const listings = useMyListings();

  const properties = useMemo<PropOption[]>(() => {
    if (isLandlord) {
      return (listings.data?.data ?? []).map((p) => ({ id: p.id, title: p.title }));
    }
    // Tenant chỉ đặt dịch vụ cho phòng đang thuê (booking active)
    const map = new Map<string, string>();
    (bookings.data?.data ?? [])
      .filter((b) => b.status === 'active')
      .forEach((b) => {
        const prop = typeof b.property === 'object' ? b.property : null;
        if (prop?.id) map.set(prop.id, prop.title);
      });
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [isLandlord, listings.data, bookings.data]);

  const loadingProps = isLandlord ? listings.isLoading : bookings.isLoading;

  // Dải 14 ngày kể từ hôm nay
  const days = useMemo(() => {
    const today = midnight(new Date());
    return Array.from({ length: 14 }, (_, i) => new Date(today.getTime() + i * 86400000));
  }, []);

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date(midnight(new Date()).getTime() + 86400000)); // mặc định: mai
  const [timeMins, setTimeMins] = useState(8 * 60); // 08:00
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const inStrip = useMemo(() => days.some((d) => sameDay(d, date)), [days, date]);

  const dayLabel = (d: Date) => {
    const diff = Math.round((midnight(d).getTime() - midnight(new Date()).getTime()) / 86400000);
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    return `${WD[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const summary = `${dayLabel(date)} · ${fmtTime(timeMins)}`;

  const now = new Date();
  const isToday = sameDay(date, now);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const timePast = (m: number) => isToday && m <= nowMins;
  const inTimeStrip = TIMES.includes(timeMins);
  const timeValue = useMemo(() => {
    const t = new Date(date);
    t.setHours(Math.floor(timeMins / 60), timeMins % 60, 0, 0);
    return t;
  }, [date, timeMins]);

  const create = useCreateServiceOrder();

  const submit = () => {
    setError('');
    if (!propertyId) {
      setError('Vui lòng chọn bất động sản');
      return;
    }
    const scheduled = new Date(date);
    scheduled.setHours(Math.floor(timeMins / 60), timeMins % 60, 0, 0);
    if (scheduled <= new Date()) {
      setError('Vui lòng chọn thời gian trong tương lai');
      return;
    }

    create.mutate(
      { property: propertyId, type: type as ServiceType, scheduledAt: scheduled.toISOString(), note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã đặt dịch vụ! Chờ chủ nhà xác nhận.');
          router.replace('/services/orders');
        },
        onError: (e) =>
          setError(
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Đặt dịch vụ thất bại',
          ),
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Đặt dịch vụ" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {item && (
          <View style={styles.service}>
            <View style={styles.iconWrap}>
              <Ionicons name={SERVICE_ICON[item.type] ?? 'cube-outline'} size={24} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.servicePrice}>
                {formatPrice(item.price)}đ<Text style={styles.unit}> / {item.unit}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Chọn property */}
        <Text style={styles.label}>{isLandlord ? 'Chọn tin đăng' : 'Chọn nơi ở'}</Text>
        {loadingProps ? (
          <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} />
        ) : properties.length === 0 ? (
          <View style={styles.emptyProps}>
            <Text style={styles.emptyText}>
              {isLandlord
                ? 'Bạn chưa có tin đăng nào.'
                : 'Bạn chưa có phòng đang thuê. Chỉ đặt được dịch vụ cho phòng đã nhận (đang thuê).'}
            </Text>
          </View>
        ) : (
          <View style={styles.propList}>
            {properties.map((p) => {
              const active = p.id === propertyId;
              return (
                <PressableScale
                  key={p.id}
                  style={[styles.propCard, active && styles.propCardActive]}
                  scaleTo={0.98}
                  onPress={() => setPropertyId(p.id)}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.brand : '#bbb'}
                  />
                  <Text style={styles.propTitle} numberOfLines={1}>{p.title}</Text>
                </PressableScale>
              );
            })}
          </View>
        )}

        {/* Thời gian — dòng tóm tắt, mở bảng chọn */}
        <Text style={styles.label}>Thời gian mong muốn</Text>
        <PressableScale style={styles.summaryRow} haptic onPress={() => setShowSheet(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.brand} />
          <Text style={styles.summaryText}>{summary}</Text>
          <Ionicons name="chevron-forward" size={18} color="#bbb" />
        </PressableScale>

        <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
          <Pressable style={styles.backdrop} onPress={() => setShowSheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Chọn thời gian</Text>

            <Text style={styles.sheetLabel}>Ngày</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStrip}
            >
          {days.map((d, i) => {
            const active = inStrip && sameDay(d, date);
            const wd = i === 0 ? 'Hôm nay' : i === 1 ? 'Mai' : WD[d.getDay()];
            return (
              <PressableScale
                key={d.toISOString()}
                style={[styles.dateChip, active && styles.dateChipActive]}
                scaleTo={0.92}
                onPress={() => setDate(d)}
              >
                <Text style={[styles.weekday, active && styles.dateTxtActive]}>{wd}</Text>
                <Text style={[styles.dayNum, active && styles.dateTxtActive]}>{d.getDate()}</Text>
                <Text style={[styles.monthTxt, active && styles.dateTxtActive]}>Th{d.getMonth() + 1}</Text>
              </PressableScale>
            );
          })}

          {/* Thẻ "Khác" — mở lịch đầy đủ để chọn tháng/ngày xa */}
          <PressableScale
            style={[styles.dateChip, !inStrip && styles.dateChipActive]}
            scaleTo={0.92}
            haptic
            onPress={() => setShowPicker(true)}
          >
            {inStrip ? (
              <>
                <Ionicons name="calendar-outline" size={20} color={colors.brand} />
                <Text style={styles.otherLabel}>Khác</Text>
              </>
            ) : (
              <>
                <Text style={[styles.weekday, styles.dateTxtActive]}>{WD[date.getDay()]}</Text>
                <Text style={[styles.dayNum, styles.dateTxtActive]}>{date.getDate()}</Text>
                <Text style={[styles.monthTxt, styles.dateTxtActive]}>Th{date.getMonth() + 1}</Text>
              </>
            )}
          </PressableScale>
        </ScrollView>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={days[0]}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(_e, d) => {
              setShowPicker(Platform.OS === 'ios');
              if (d) setDate(midnight(d));
            }}
            onDismiss={() => setShowPicker(false)}
          />
        )}

            <Text style={styles.sheetLabel}>Giờ</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeStrip}
        >
          {TIMES.map((m) => {
            const active = inTimeStrip && m === timeMins;
            const past = timePast(m);
            return (
              <PressableScale
                key={m}
                style={[styles.timeChip, active && styles.timeChipActive, past && styles.timeDisabled]}
                scaleTo={0.92}
                disabled={past}
                onPress={() => setTimeMins(m)}
              >
                <Text style={[styles.timeTxt, active && styles.timeTxtActive, past && styles.timeTxtPast]}>
                  {fmtTime(m)}
                </Text>
              </PressableScale>
            );
          })}

          {/* Giờ khác — mở đồng hồ chọn chính xác */}
          <PressableScale
            style={[styles.timeChip, styles.timeOther, !inTimeStrip && styles.timeChipActive]}
            scaleTo={0.92}
            haptic
            onPress={() => setShowTimePicker(true)}
          >
            {inTimeStrip ? (
              <>
                <Ionicons name="time-outline" size={16} color={colors.brand} />
                <Text style={styles.timeOtherTxt}>Khác</Text>
              </>
            ) : (
              <Text style={[styles.timeTxt, styles.timeTxtActive]}>{fmtTime(timeMins)}</Text>
            )}
          </PressableScale>
        </ScrollView>

        {showTimePicker && (
          <DateTimePicker
            value={timeValue}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={(_e, d) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (d) setTimeMins(d.getHours() * 60 + d.getMinutes());
            }}
            onDismiss={() => setShowTimePicker(false)}
          />
        )}

            <PressableScale style={styles.sheetConfirm} haptic="medium" onPress={() => setShowSheet(false)}>
              <Text style={styles.sheetConfirmText}>Xác nhận</Text>
            </PressableScale>
          </View>
        </Modal>

        {/* Ghi chú */}
        <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Mô tả thêm yêu cầu của bạn..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          value={note}
          onChangeText={setNote}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <PressableScale
          style={[styles.submit, (create.isPending || properties.length === 0) && { opacity: 0.6 }]}
          haptic="medium"
          disabled={create.isPending || properties.length === 0}
          onPress={submit}
        >
          {create.isPending ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.submitText}>Đặt dịch vụ</Text>
          )}
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.card,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 16, fontWeight: '800', color: colors.text },
  servicePrice: { fontSize: 14, fontWeight: '800', color: colors.brand, marginTop: 2 },
  unit: { fontSize: 12, fontWeight: '500', color: colors.muted },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8 },
  emptyProps: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, ...shadow.soft },
  emptyText: { fontSize: 13.5, color: colors.muted, lineHeight: 19 },
  propList: { gap: 8 },
  propCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.soft,
  },
  propCardActive: { borderColor: colors.accent },
  propTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

  dateStrip: { gap: 10, paddingVertical: 2, paddingRight: 8 },
  dateChip: {
    width: 60,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: 2,
    ...shadow.soft,
  },
  dateChipActive: { backgroundColor: colors.brand },
  weekday: { fontSize: 12, fontWeight: '700', color: colors.muted },
  dayNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  monthTxt: { fontSize: 11, color: colors.muted },
  dateTxtActive: { color: '#fff' },
  otherLabel: { fontSize: 12, fontWeight: '700', color: colors.brand, marginTop: 4 },

  timeStrip: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  timeChipActive: { backgroundColor: colors.accent },
  timeDisabled: { opacity: 0.4 },
  timeTxt: { fontSize: 14, fontWeight: '700', color: colors.text },
  timeTxtActive: { color: colors.accentText },
  timeTxtPast: { color: colors.muted },
  timeOther: { flexDirection: 'row', gap: 5 },
  timeOtherTxt: { fontSize: 13, fontWeight: '700', color: colors.brand },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...shadow.soft,
  },
  summaryText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 34,
    gap: 10,
    ...shadow.float,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999, backgroundColor: colors.border, marginBottom: 4 },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 4 },
  sheetLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 6 },
  sheetConfirm: { backgroundColor: colors.accent, paddingVertical: 15, borderRadius: radius.pill, alignItems: 'center', marginTop: 14 },
  sheetConfirmText: { fontSize: 16, fontWeight: '800', color: colors.accentText },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginTop: 4 },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: '800', color: colors.accentText },
});
