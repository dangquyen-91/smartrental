import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import {
  CLEAN_LABEL,
  CLEAN_OPTS,
  DURATION_LABEL,
  DURATION_OPTS,
  GENDER_LABEL,
  GENDER_OPTS,
  LIFESTYLE_LABEL,
  LIFESTYLE_OPTS,
  SCHEDULE_LABEL,
  SCHEDULE_OPTS,
  YESNO_LABEL,
  YESNO_OPTS,
} from '@/constants/roommate-meta';
import { useMyRoommateProfile, useUpsertRoommateProfile } from '@/hooks/use-roommate';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { toast } from '@/stores/toast.store';
import type {
  Cleanliness,
  Duration,
  Gender,
  Lifestyle,
  Schedule,
  YesNo,
} from '@/types/roommate';

function ChipGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o === value;
        return (
          <PressableScale
            key={o}
            style={[styles.chip, active && styles.chipActive]}
            scaleTo={0.95}
            onPress={() => onChange(o)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{labels[o]}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export default function RoommateProfileForm() {
  const router = useRouter();
  const { data: existing } = useMyRoommateProfile();
  const upsert = useUpsertRoommateProfile();

  const [min, setMin] = useState(String(existing?.budget.min ?? 2000000));
  const [max, setMax] = useState(String(existing?.budget.max ?? 4000000));
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'any');
  const [schedule, setSchedule] = useState<Schedule>(existing?.schedule ?? 'flexible');
  const [lifestyle, setLifestyle] = useState<Lifestyle>(existing?.lifestyle ?? 'mixed');
  const [cleanliness, setCleanliness] = useState<Cleanliness>(existing?.cleanliness ?? 'average');
  const [duration, setDuration] = useState<Duration>(existing?.duration ?? 'flexible');
  const [pets, setPets] = useState<YesNo>(existing?.pets ?? 'no');
  const [smoking, setSmoking] = useState<YesNo>(existing?.smoking ?? 'no');
  const [looking, setLooking] = useState(existing?.looking ?? true);
  const [city, setCity] = useState(existing?.city ?? '');
  const [bio, setBio] = useState(existing?.bio ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    const minN = Number(min);
    const maxN = Number(max);
    if (!minN || !maxN || minN > maxN) {
      setError('Ngân sách không hợp lệ (tối thiểu ≤ tối đa)');
      return;
    }
    upsert.mutate(
      {
        budget: { min: minN, max: maxN },
        gender,
        schedule,
        lifestyle,
        cleanliness,
        duration,
        pets,
        smoking,
        looking,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã lưu hồ sơ tìm ghép');
          router.back();
        },
        onError: (e) =>
          setError(
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Lưu hồ sơ thất bại',
          ),
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title={existing ? 'Sửa hồ sơ ghép' : 'Tạo hồ sơ ghép'} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Đang tìm */}
        <View style={styles.lookingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lookingTitle}>Đang tìm bạn ở ghép</Text>
            <Text style={styles.lookingSub}>Bật để xuất hiện trong gợi ý của người khác</Text>
          </View>
          <Switch
            value={looking}
            onValueChange={setLooking}
            trackColor={{ true: colors.accent, false: '#ccc' }}
            thumbColor={looking ? colors.brand : '#fff'}
          />
        </View>

        <Text style={styles.label}>Ngân sách (đ/tháng)</Text>
        <View style={styles.row2}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Tối thiểu"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={min}
            onChangeText={setMin}
          />
          <Text style={styles.dash}>–</Text>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Tối đa"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={max}
            onChangeText={setMax}
          />
        </View>

        <Text style={styles.label}>Giới tính muốn ghép</Text>
        <ChipGroup options={GENDER_OPTS} labels={GENDER_LABEL} value={gender} onChange={setGender} />

        <Text style={styles.label}>Giờ giấc sinh hoạt</Text>
        <ChipGroup options={SCHEDULE_OPTS} labels={SCHEDULE_LABEL} value={schedule} onChange={setSchedule} />

        <Text style={styles.label}>Lối sống</Text>
        <ChipGroup options={LIFESTYLE_OPTS} labels={LIFESTYLE_LABEL} value={lifestyle} onChange={setLifestyle} />

        <Text style={styles.label}>Mức độ gọn gàng</Text>
        <ChipGroup options={CLEAN_OPTS} labels={CLEAN_LABEL} value={cleanliness} onChange={setCleanliness} />

        <Text style={styles.label}>Thời hạn ở</Text>
        <ChipGroup options={DURATION_OPTS} labels={DURATION_LABEL} value={duration} onChange={setDuration} />

        <View style={styles.row2}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Thú cưng</Text>
            <ChipGroup options={YESNO_OPTS} labels={YESNO_LABEL} value={pets} onChange={setPets} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Hút thuốc</Text>
            <ChipGroup options={YESNO_OPTS} labels={YESNO_LABEL} value={smoking} onChange={setSmoking} />
          </View>
        </View>

        <Text style={styles.label}>Khu vực (không bắt buộc)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: TP. Hồ Chí Minh"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>Giới thiệu (không bắt buộc)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Vài dòng về bạn & mong muốn khi ở ghép..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          value={bio}
          onChangeText={setBio}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <PressableScale style={styles.submit} haptic="medium" disabled={upsert.isPending} onPress={submit}>
          {upsert.isPending ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.submitText}>Lưu hồ sơ</Text>
          )}
        </PressableScale>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  lookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.soft,
  },
  lookingTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  lookingSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 10 },
  row2: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  flex1: { flex: 1 },
  dash: { fontSize: 18, color: colors.muted, alignSelf: 'center' },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  chipActive: { backgroundColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#fff' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginTop: 6 },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', marginTop: 12 },
  submitText: { fontSize: 16, fontWeight: '800', color: colors.accentText },
});
