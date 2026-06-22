import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { createPropertyApi } from '@/lib/api/properties.api';
import { uploadImagesApi } from '@/lib/api/upload.api';
import { updateBankAccountApi } from '@/lib/api/users.api';
import { getMeApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import type { PropertyType } from '@/types/property';

type IoniconName = keyof typeof Ionicons.glyphMap;

const TYPES: { value: PropertyType; label: string; icon: IoniconName }[] = [
  { value: 'room', label: 'Phòng trọ', icon: 'bed-outline' },
  { value: 'apartment', label: 'Căn hộ', icon: 'business-outline' },
  { value: 'house', label: 'Nhà nguyên căn', icon: 'home-outline' },
  { value: 'studio', label: 'Studio', icon: 'cube-outline' },
];

const AMENITIES = [
  'WiFi', 'Máy lạnh', 'Bãi đỗ xe', 'Bảo vệ 24/7', 'Camera an ninh',
  'Máy giặt', 'Tủ lạnh', 'Bếp riêng', 'Ban công', 'Thang máy',
  'Nội thất đầy đủ', 'Điện nước riêng', 'Sân phơi', 'Gần chợ/siêu thị',
];

const MAX_IMAGES = 10;

interface PickedImage {
  uri: string;
  name?: string | null;
  type?: string | null;
}

function getErr(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function NewListing() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Lấy hồ sơ mới nhất để biết đã có tài khoản ngân hàng chưa
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMeApi });
  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);
  const current = me ?? user;
  const needBank = !current?.bankAccount?.bankName;

  // form state
  const [images, setImages] = useState<PickedImage[]>([]);
  const [primary, setPrimary] = useState(0);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropertyType>('room');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  // bank state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Cần cấp quyền truy cập ảnh để chọn.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    const picked = res.assets.map((a) => ({ uri: a.uri, name: a.fileName, type: a.mimeType }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPrimary((p) => (i === p ? 0 : i < p ? p - 1 : p));
  };

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const validate = (): string | null => {
    if (images.length === 0) return 'Vui lòng chọn ít nhất 1 ảnh';
    if (title.trim().length < 10) return 'Tiêu đề tối thiểu 10 ký tự';
    if (!(Number(price) >= 2000)) return 'Giá tối thiểu 2.000₫';
    if (!(Number(area) >= 5)) return 'Diện tích tối thiểu 5 m²';
    if (!city.trim()) return 'Vui lòng nhập thành phố';
    if (!district.trim()) return 'Vui lòng nhập quận/huyện';
    if (needBank) {
      if (bankName.trim().length < 2) return 'Vui lòng nhập tên ngân hàng';
      if (!/^[0-9]{6,20}$/.test(accountNumber)) return 'Số tài khoản phải 6–20 chữ số';
      if (accountName.trim().length < 2) return 'Vui lòng nhập tên chủ tài khoản';
    }
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 1. Lưu tài khoản ngân hàng nếu chưa có
      if (needBank && current) {
        const updated = await updateBankAccountApi(current.id, {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim().toUpperCase(),
        });
        setUser(updated);
      }

      // 2. Upload ảnh
      const uploaded = await uploadImagesApi(images);

      // 3. Tạo tin
      await createPropertyApi({
        title: title.trim(),
        type,
        price: Number(price),
        area: Number(area),
        ...(bedrooms ? { bedrooms: Number(bedrooms) } : {}),
        ...(bathrooms ? { bathrooms: Number(bathrooms) } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        address: {
          city: city.trim(),
          district: district.trim(),
          ...(ward.trim() ? { ward: ward.trim() } : {}),
          ...(street.trim() ? { street: street.trim() } : {}),
        },
        amenities,
        images: uploaded.map((img, idx) => ({ url: img.url, isPrimary: idx === primary })),
      });

      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      router.replace('/listings');
    } catch (err) {
      setError(getErr(err, 'Đăng tin thất bại, vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Đăng tin mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh bất động sản</Text>
          <Text style={styles.hint}>Ảnh đầu tiên là ảnh hiển thị chính. Tối đa {MAX_IMAGES} ảnh.</Text>
          <View style={styles.imageGrid}>
            {images.map((img, i) => (
              <View key={img.uri} style={styles.imgWrap}>
                <Image source={{ uri: img.uri }} style={styles.img} />
                <Pressable style={styles.imgRemove} onPress={() => removeImage(i)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
                <Pressable style={styles.primaryTag} onPress={() => setPrimary(i)}>
                  <Ionicons
                    name={i === primary ? 'star' : 'star-outline'}
                    size={14}
                    color={i === primary ? colors.accent : '#fff'}
                  />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable style={styles.addImg} onPress={pickImages}>
                <Ionicons name="add" size={26} color={colors.muted} />
                <Text style={styles.addImgText}>Thêm ảnh</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Thông tin cơ bản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <Field label="Tiêu đề" required>
            <TextInput
              style={styles.input}
              placeholder="VD: Phòng trọ rộng rãi gần ĐH Bách Khoa..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          <Field label="Loại bất động sản" required>
            <View style={styles.typeRow}>
              {TYPES.map((t) => {
                const active = t.value === type;
                return (
                  <Pressable
                    key={t.value}
                    style={[styles.typeBtn, active && styles.typeBtnActive]}
                    onPress={() => setType(t.value)}
                  >
                    <Ionicons name={t.icon} size={20} color={active ? '#fff' : colors.muted} />
                    <Text style={[styles.typeText, active && styles.typeTextActive]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <View style={styles.row2}>
            <Field label="Giá (₫/tháng)" required style={styles.flex1}>
              <TextInput
                style={styles.input}
                placeholder="3500000"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={price}
                onChangeText={setPrice}
              />
            </Field>
            <Field label="Diện tích (m²)" required style={styles.flex1}>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={area}
                onChangeText={setArea}
              />
            </Field>
          </View>

          <View style={styles.row2}>
            <Field label="Phòng ngủ" style={styles.flex1}>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={bedrooms}
                onChangeText={setBedrooms}
              />
            </Field>
            <Field label="Phòng tắm" style={styles.flex1}>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={bathrooms}
                onChangeText={setBathrooms}
              />
            </Field>
          </View>

          <Field label="Mô tả">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Mô tả chi tiết về phòng..."
              placeholderTextColor="#999"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </Field>
        </View>

        {/* Địa chỉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.row2}>
            <Field label="Thành phố" required style={styles.flex1}>
              <TextInput style={styles.input} placeholder="TP. HCM" placeholderTextColor="#999" value={city} onChangeText={setCity} />
            </Field>
            <Field label="Quận/Huyện" required style={styles.flex1}>
              <TextInput style={styles.input} placeholder="Quận 1" placeholderTextColor="#999" value={district} onChangeText={setDistrict} />
            </Field>
          </View>
          <View style={styles.row2}>
            <Field label="Phường/Xã" style={styles.flex1}>
              <TextInput style={styles.input} placeholder="Bến Thành" placeholderTextColor="#999" value={ward} onChangeText={setWard} />
            </Field>
            <Field label="Đường/Số nhà" style={styles.flex1}>
              <TextInput style={styles.input} placeholder="123 Lê Lợi" placeholderTextColor="#999" value={street} onChangeText={setStreet} />
            </Field>
          </View>
        </View>

        {/* Tiện nghi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiện nghi</Text>
          <View style={styles.amenities}>
            {AMENITIES.map((a) => {
              const on = amenities.includes(a);
              return (
                <Pressable
                  key={a}
                  style={[styles.amenity, on && styles.amenityOn]}
                  onPress={() => toggleAmenity(a)}
                >
                  {on && <Ionicons name="checkmark" size={14} color={colors.accentText} />}
                  <Text style={[styles.amenityText, on && styles.amenityTextOn]}>{a}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tài khoản ngân hàng (nếu chưa có) */}
        {needBank && (
          <View style={[styles.section, styles.bankSection]}>
            <View style={styles.bankHead}>
              <Ionicons name="card-outline" size={18} color={colors.brand} />
              <Text style={styles.sectionTitle}>Tài khoản ngân hàng</Text>
            </View>
            <Text style={styles.hint}>Cần thiết để nhận thanh toán từ khách thuê.</Text>
            <Field label="Tên ngân hàng" required>
              <TextInput style={styles.input} placeholder="VD: Vietcombank" placeholderTextColor="#999" value={bankName} onChangeText={setBankName} />
            </Field>
            <Field label="Số tài khoản" required>
              <TextInput style={styles.input} placeholder="1234567890" placeholderTextColor="#999" keyboardType="number-pad" value={accountNumber} onChangeText={setAccountNumber} />
            </Field>
            <Field label="Tên chủ tài khoản" required>
              <TextInput style={[styles.input, { textTransform: 'uppercase' }]} placeholder="NGUYEN VAN A" placeholderTextColor="#999" value={accountName} onChangeText={setAccountName} />
            </Field>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={loading} onPress={submit}>
          {loading ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.submitText}>Đăng tin</Text>
          )}
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  required,
  style,
  children,
}: {
  label: string;
  required?: boolean;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
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

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  bankSection: { borderColor: colors.brand },
  bankHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.muted, marginTop: -4 },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text },
  textarea: { height: 90, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  typeBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  typeText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  typeTextActive: { color: '#fff' },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imgWrap: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden' },
  img: { width: '100%', height: '100%', backgroundColor: colors.surfaceAlt },
  imgRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImgText: { fontSize: 11, color: colors.muted, marginTop: 2 },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  amenityText: { fontSize: 13, color: colors.text },
  amenityTextOn: { color: colors.accentText, fontWeight: '600' },

  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
