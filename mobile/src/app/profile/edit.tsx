import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { updateProfileApi, type UpdateProfileInput } from '@/lib/api/users.api';
import { uploadImagesApi } from '@/lib/api/upload.api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

type Gender = 'male' | 'female' | 'other';
const GENDERS: { key: Gender; label: string }[] = [
  { key: 'male', label: 'Nam' },
  { key: 'female', label: 'Nữ' },
  { key: 'other', label: 'Khác' },
];

const fmtDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function EditProfile() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState((user as { bio?: string })?.bio ?? '');
  const [address, setAddress] = useState((user as { address?: string })?.address ?? '');
  const [gender, setGender] = useState<Gender | undefined>((user as { gender?: Gender })?.gender);
  const [dob, setDob] = useState<string | undefined>((user as { dateOfBirth?: string })?.dateOfBirth);
  const [avatar] = useState(user?.avatar ?? '');
  const [localAvatar, setLocalAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const phoneLocked = !!user?.isPhoneVerified;

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) setLocalAvatar(res.assets[0]);
  };

  const save = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    setError('');
    setSaving(true);
    try {
      let avatarUrl = avatar;
      if (localAvatar) {
        const [uploaded] = await uploadImagesApi([
          { uri: localAvatar.uri, name: localAvatar.fileName, type: localAvatar.mimeType },
        ]);
        avatarUrl = uploaded.url;
      }

      const payload: UpdateProfileInput = {
        name: name.trim(),
        bio: bio.trim() || undefined,
        address: address.trim() || undefined,
        gender,
        dateOfBirth: dob,
        avatar: avatarUrl || undefined,
      };
      if (!phoneLocked && phone.trim()) payload.phone = phone.trim();

      const updated = await updateProfileApi(user.id, payload);
      setUser(updated);
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Cập nhật hồ sơ thành công');
      router.back();
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Cập nhật thất bại',
      );
    } finally {
      setSaving(false);
    }
  };

  const avatarUri = localAvatar?.uri ?? avatar;

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sửa hồ sơ</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Pressable style={styles.avatarBtn} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{name.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={15} color={colors.accentText} />
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Chạm để đổi ảnh đại diện</Text>
        </View>

        <Field label="Họ tên">
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Họ và tên" placeholderTextColor="#999" />
        </Field>

        <Field label={`Số điện thoại${phoneLocked ? ' (đã xác thực)' : ''}`}>
          <TextInput
            style={[styles.input, phoneLocked && styles.inputDisabled]}
            value={phone}
            onChangeText={setPhone}
            editable={!phoneLocked}
            keyboardType="phone-pad"
            placeholder="0xxxxxxxxx"
            placeholderTextColor="#999"
          />
        </Field>

        <Field label="Giới tính">
          <View style={styles.chips}>
            {GENDERS.map((g) => {
              const active = gender === g.key;
              return (
                <Pressable
                  key={g.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setGender(g.key)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Ngày sinh">
          <Pressable style={styles.input} onPress={() => setShowDate(true)}>
            <Text style={{ color: dob ? colors.text : '#999', fontSize: 15 }}>
              {dob ? fmtDate(dob) : 'Chọn ngày sinh'}
            </Text>
          </Pressable>
          {showDate && (
            <DateTimePicker
              value={dob ? new Date(dob) : new Date(2000, 0, 1)}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={(_e, d) => {
                setShowDate(Platform.OS === 'ios');
                if (d) setDob(d.toISOString().split('T')[0]);
              }}
              onDismiss={() => setShowDate(false)}
            />
          )}
        </Field>

        <Field label="Địa chỉ">
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Địa chỉ liên hệ" placeholderTextColor="#999" />
        </Field>

        <Field label="Giới thiệu">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Vài dòng về bạn..."
            placeholderTextColor="#999"
            multiline
            maxLength={300}
          />
        </Field>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={saving} onPress={save}>
          {saving ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.submitText}>Lưu thay đổi</Text>}
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', gap: 8, marginBottom: 4 },
  avatarBtn: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 999, backgroundColor: colors.surfaceAlt },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '800' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  avatarHint: { fontSize: 12, color: colors.muted },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  inputDisabled: { backgroundColor: colors.surfaceAlt, color: colors.muted },
  textarea: { height: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.accentText },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
