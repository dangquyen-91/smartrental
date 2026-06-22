import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { updatePropertyApi } from '@/lib/api/properties.api';
import { uploadImagesApi } from '@/lib/api/upload.api';
import { useProperty } from '@/hooks/use-properties';
import type { Property, PropertyType } from '@/types/property';

type IoniconName = keyof typeof Ionicons.glyphMap;

const TYPES: { value: PropertyType; label: string; icon: IoniconName }[] = [
  { value: 'room', label: 'Phòng trọ', icon: 'bed-outline' },
  { value: 'apartment', label: 'Căn hộ', icon: 'business-outline' },
  { value: 'house', label: 'Nhà nguyên căn', icon: 'home-outline' },
  { value: 'studio', label: 'Studio', icon: 'cube-outline' },
];

const STATUSES: { value: Property['status']; label: string }[] = [
  { value: 'available', label: 'Đang hiển thị' },
  { value: 'rented', label: 'Đã cho thuê' },
  { value: 'maintenance', label: 'Bảo trì' },
];

const AMENITIES = [
  'WiFi', 'Máy lạnh', 'Bãi đỗ xe', 'Bảo vệ 24/7', 'Camera an ninh',
  'Máy giặt', 'Tủ lạnh', 'Bếp riêng', 'Ban công', 'Thang máy',
  'Nội thất đầy đủ', 'Điện nước riêng', 'Sân phơi', 'Gần chợ/siêu thị',
];

const MAX_IMAGES = 10;

type EditImage =
  | { key: string; remote: true; url: string; isPrimary: boolean }
  | { key: string; remote: false; uri: string; name?: string | null; type?: string | null; isPrimary: boolean };

function getErr(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function EditListing() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: p, isLoading } = useProperty(id);

  const [ready, setReady] = useState(false);
  const [images, setImages] = useState<EditImage[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropertyType>('room');
  const [status, setStatus] = useState<Property['status']>('available');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nạp dữ liệu vào form 1 lần khi có property
  useEffect(() => {
    if (!p || ready) return;
    setImages(
      (p.images ?? []).map((img, i) => ({
        key: `r-${i}`,
        remote: true as const,
        url: img.url,
        isPrimary: !!img.isPrimary,
      })),
    );
    setTitle(p.title ?? '');
    setType(p.type);
    setStatus(p.status);
    setPrice(String(p.price ?? ''));
    setArea(String(p.area ?? ''));
    setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '');
    setBathrooms(p.bathrooms != null ? String(p.bathrooms) : '');
    setDescription(p.description ?? '');
    setCity(p.address?.city ?? '');
    setDistrict(p.address?.district ?? '');
    setWard(p.address?.ward ?? '');
    setStreet(p.address?.street ?? '');
    setAmenities(p.amenities ?? []);
    setReady(true);
  }, [p, ready]);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Cần cấp quyền truy cập ảnh.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });
    if (res.canceled) return;
    const picked: EditImage[] = res.assets.map((a, i) => ({
      key: `l-${Date.now()}-${i}`,
      remote: false as const,
      uri: a.uri,
      name: a.fileName,
      type: a.mimeType,
      isPrimary: false,
    }));
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const removeImage = (key: string) =>
    setImages((prev) => {
      const next = prev.filter((x) => x.key !== key);
      if (next.length && !next.some((x) => x.isPrimary)) next[0].isPrimary = true;
      return [...next];
    });

  const setPrimary = (key: string) =>
    setImages((prev) => prev.map((x) => ({ ...x, isPrimary: x.key === key })));

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const validate = (): string | null => {
    if (images.length === 0) return 'Cần ít nhất 1 ảnh';
    if (title.trim().length < 10) return 'Tiêu đề tối thiểu 10 ký tự';
    if (!(Number(price) >= 2000)) return 'Giá tối thiểu 2.000₫';
    if (!(Number(area) >= 5)) return 'Diện tích tối thiểu 5 m²';
    if (!city.trim()) return 'Vui lòng nhập thành phố';
    if (!district.trim()) return 'Vui lòng nhập quận/huyện';
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
      // Upload ảnh mới (local), giữ ảnh cũ (remote)
      const locals = images.filter((i) => !i.remote) as Extract<EditImage, { remote: false }>[];
      const uploaded = locals.length
        ? await uploadImagesApi(locals.map((l) => ({ uri: l.uri, name: l.name, type: l.type })))
        : [];
      let li = 0;
      const finalImages = images.map((i) => ({
        url: i.remote ? i.url : uploaded[li++].url,
        isPrimary: i.isPrimary,
      }));
      if (finalImages.length && !finalImages.some((x) => x.isPrimary)) finalImages[0].isPrimary = true;

      await updatePropertyApi(id, {
        title: title.trim(),
        type,
        status,
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
        images: finalImages,
      });

      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property', id] });
      router.back();
    } catch (err) {
      setError(getErr(err, 'Cập nhật thất bại, vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !ready) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sửa tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Trạng thái */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => {
              const on = s.value === status;
              return (
                <Pressable key={s.value} style={[styles.statusBtn, on && styles.statusOn]} onPress={() => setStatus(s.value)}>
                  <Text style={[styles.statusText, on && styles.statusTextOn]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ảnh */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh bất động sản</Text>
          <View style={styles.imageGrid}>
            {images.map((img) => (
              <View key={img.key} style={styles.imgWrap}>
                <Image source={{ uri: img.remote ? img.url : img.uri }} style={styles.img} />
                <Pressable style={styles.imgRemove} onPress={() => removeImage(img.key)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
                <Pressable style={styles.primaryTag} onPress={() => setPrimary(img.key)}>
                  <Ionicons name={img.isPrimary ? 'star' : 'star-outline'} size={14} color={img.isPrimary ? colors.accent : '#fff'} />
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
            <TextInput style={styles.input} placeholderTextColor="#999" value={title} onChangeText={setTitle} />
          </Field>
          <Field label="Loại bất động sản" required>
            <View style={styles.typeRow}>
              {TYPES.map((t) => {
                const on = t.value === type;
                return (
                  <Pressable key={t.value} style={[styles.typeBtn, on && styles.typeBtnActive]} onPress={() => setType(t.value)}>
                    <Ionicons name={t.icon} size={20} color={on ? '#fff' : colors.muted} />
                    <Text style={[styles.typeText, on && styles.typeTextActive]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
          <View style={styles.row2}>
            <Field label="Giá (₫/tháng)" required style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" keyboardType="number-pad" value={price} onChangeText={setPrice} />
            </Field>
            <Field label="Diện tích (m²)" required style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" keyboardType="number-pad" value={area} onChangeText={setArea} />
            </Field>
          </View>
          <View style={styles.row2}>
            <Field label="Phòng ngủ" style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" keyboardType="number-pad" value={bedrooms} onChangeText={setBedrooms} />
            </Field>
            <Field label="Phòng tắm" style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" keyboardType="number-pad" value={bathrooms} onChangeText={setBathrooms} />
            </Field>
          </View>
          <Field label="Mô tả">
            <TextInput style={[styles.input, styles.textarea]} placeholderTextColor="#999" multiline value={description} onChangeText={setDescription} />
          </Field>
        </View>

        {/* Địa chỉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.row2}>
            <Field label="Thành phố" required style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" value={city} onChangeText={setCity} />
            </Field>
            <Field label="Quận/Huyện" required style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" value={district} onChangeText={setDistrict} />
            </Field>
          </View>
          <View style={styles.row2}>
            <Field label="Phường/Xã" style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" value={ward} onChangeText={setWard} />
            </Field>
            <Field label="Đường/Số nhà" style={styles.flex1}>
              <TextInput style={styles.input} placeholderTextColor="#999" value={street} onChangeText={setStreet} />
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
                <Pressable key={a} style={[styles.amenity, on && styles.amenityOn]} onPress={() => toggleAmenity(a)}>
                  {on && <Ionicons name="checkmark" size={14} color={colors.accentText} />}
                  <Text style={[styles.amenityText, on && styles.amenityTextOn]}>{a}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={loading} onPress={submit}>
          {loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.submitText}>Lưu thay đổi</Text>}
        </Pressable>
      </ScrollView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  section: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },

  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  statusOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  statusTextOn: { color: '#fff' },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text },
  textarea: { height: 90, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { width: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingVertical: 12 },
  typeBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  typeText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  typeTextActive: { color: '#fff' },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imgWrap: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden' },
  img: { width: '100%', height: '100%', backgroundColor: colors.surfaceAlt },
  imgRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  primaryTag: { position: 'absolute', bottom: 4, left: 4, width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  addImg: { width: 90, height: 90, borderRadius: 10, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addImgText: { fontSize: 11, color: colors.muted, marginTop: 2 },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  amenityOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  amenityText: { fontSize: 13, color: colors.text },
  amenityTextOn: { color: colors.accentText, fontWeight: '600' },

  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
