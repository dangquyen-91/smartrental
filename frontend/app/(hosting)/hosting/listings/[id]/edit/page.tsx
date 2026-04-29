'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Upload, X, Star, ImagePlus,
  Loader2, Home, Hotel, Building2, Box,
} from 'lucide-react';
import Link from 'next/link';
import { useProperty, useUpdateProperty, propertyKeys } from '@/hooks/use-properties';
import { uploadImagesApi, deleteUploadedImageApi } from '@/lib/api/upload.api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES: { value: Property['type']; label: string; icon: React.ElementType }[] = [
  { value: 'room',      label: 'Phòng trọ',      icon: Home },
  { value: 'apartment', label: 'Căn hộ',          icon: Hotel },
  { value: 'house',     label: 'Nhà nguyên căn',  icon: Building2 },
  { value: 'studio',    label: 'Studio',           icon: Box },
];

const AMENITY_OPTIONS = [
  'WiFi', 'Máy lạnh', 'Bãi đỗ xe', 'Bảo vệ 24/7', 'Camera an ninh',
  'Máy giặt', 'Tủ lạnh', 'Bếp riêng', 'Ban công', 'Thang máy',
  'Nội thất đầy đủ', 'Điện nước riêng', 'Sân phơi', 'Gần chợ/siêu thị',
];

const STATUS_OPTIONS: { value: 'available' | 'maintenance'; label: string; cls: string }[] = [
  { value: 'available',   label: 'Còn trống', cls: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'maintenance', label: 'Bảo trì',   cls: 'border-amber-400 bg-amber-50 text-amber-700' },
];

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title:       z.string().min(10, 'Tối thiểu 10 ký tự').max(200, 'Tối đa 200 ký tự'),
  type:        z.enum(['room', 'apartment', 'house', 'studio'] as const),
  status:      z.enum(['available', 'maintenance'] as const),
  price:       z.number({ message: 'Vui lòng nhập giá' }).min(100_000, 'Giá tối thiểu 100.000₫'),
  area:        z.number({ message: 'Vui lòng nhập diện tích' }).min(5, 'Diện tích tối thiểu 5m²'),
  bedrooms:    z.number().min(0).optional(),
  bathrooms:   z.number().min(0).optional(),
  description: z.string().max(2000, 'Tối đa 2000 ký tự').optional(),
  address: z.object({
    city:     z.string().min(1, 'Vui lòng nhập thành phố'),
    district: z.string().min(1, 'Vui lòng nhập quận/huyện'),
    ward:     z.string().optional(),
    street:   z.string().optional(),
  }),
  contactName:  z.string().optional(),
  contactPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── local image state ────────────────────────────────────────────────────────

interface LocalImage {
  localId:   string;
  url:       string;
  publicId:  string;   // '' for existing images (no Cloudinary publicId available)
  isPrimary: boolean;
  uploading: boolean;
  isExisting: boolean; // came from the saved property
  error?:    string;
}

function propertyImagesToLocal(images: Property['images']): LocalImage[] {
  return images.map((img, i) => ({
    localId:    `existing-${i}-${img.url}`,
    url:        img.url,
    publicId:   '',
    isPrimary:  img.isPrimary,
    uploading:  false,
    isExisting: true,
  }));
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-hairline-gray p-6">
      <h2 className="text-base font-semibold text-ink-black mb-5">{title}</h2>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error-red">{message}</p>;
}

function InputField({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-black mb-1.5">
        {label}{required && <span className="text-rausch ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ash-gray">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 text-sm font-medium text-ink-black border border-hairline-gray rounded-lg outline-none transition-all focus:border-ink-black focus:ring-2 focus:ring-ink-black/10 placeholder:text-mute-gray';

// ─── image uploader ───────────────────────────────────────────────────────────

function ImageUploader({
  images,
  setImages,
}: {
  images: LocalImage[];
  setImages: React.Dispatch<React.SetStateAction<LocalImage[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentOk = images.filter((i) => !i.error).length;
    const remaining = MAX_FILES - currentOk;
    if (remaining <= 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) continue;
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    const placeholders: LocalImage[] = validFiles.map((f, idx) => ({
      localId:    `${Date.now()}-${idx}-${f.name}`,
      url:        URL.createObjectURL(f),
      publicId:   '',
      isPrimary:  currentOk === 0 && idx === 0,
      uploading:  true,
      isExisting: false,
    }));

    setImages((prev) => [...prev, ...placeholders]);

    try {
      const uploaded = await uploadImagesApi(validFiles);
      setImages((prev) => {
        const next = [...prev];
        placeholders.forEach((ph, i) => {
          const idx = next.findIndex((x) => x.localId === ph.localId);
          if (idx === -1) return;
          next[idx] = uploaded[i]
            ? { ...next[idx], url: uploaded[i].url, publicId: uploaded[i].publicId, uploading: false }
            : { ...next[idx], uploading: false, error: 'Upload thất bại' };
        });
        return next;
      });
    } catch {
      setImages((prev) =>
        prev.map((img) =>
          placeholders.find((p) => p.localId === img.localId)
            ? { ...img, uploading: false, error: 'Upload thất bại' }
            : img,
        ),
      );
    }
  };

  const remove = async (img: LocalImage) => {
    setImages((prev) => {
      const next = prev.filter((x) => x.localId !== img.localId);
      // nếu xoá ảnh primary, đặt ảnh đầu tiên còn lại làm primary
      if (img.isPrimary && next.length > 0 && !next.some((x) => x.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
    // chỉ xoá trên Cloudinary nếu là ảnh mới upload (có publicId)
    if (img.publicId && !img.isExisting) {
      try { await deleteUploadedImageApi(img.publicId); } catch { /* best-effort */ }
    }
    if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url);
  };

  const setPrimary = (localId: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.localId === localId })));
  };

  const successCount = images.filter((i) => !i.error).length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-card p-8 flex flex-col items-center justify-center cursor-pointer transition-all',
          dragOver ? 'border-rausch bg-rausch/5' : 'border-hairline-gray hover:border-ash-gray bg-soft-cloud hover:bg-white',
          successCount >= MAX_FILES && 'pointer-events-none opacity-40',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => processFiles(e.target.files)}
          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
        />
        <div className="size-12 bg-white border border-hairline-gray rounded-full flex items-center justify-center mb-3 shadow-sm">
          <ImagePlus className="size-5 text-ash-gray" />
        </div>
        <p className="text-sm font-semibold text-ink-black mb-0.5">
          {dragOver ? 'Thả ảnh vào đây' : 'Kéo thả hoặc nhấn để thêm ảnh'}
        </p>
        <p className="text-xs text-ash-gray text-center">
          JPEG, PNG, WebP · Tối đa {MAX_SIZE_MB}MB · Tối đa {MAX_FILES} ảnh
          {successCount > 0 && ` · Đã có ${successCount}/${MAX_FILES}`}
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.localId}
              className={cn(
                'relative aspect-4/3 rounded-[10px] overflow-hidden border-2 transition-all',
                img.isPrimary && !img.error ? 'border-rausch' : 'border-transparent',
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />

              {img.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2">
                  <p className="text-white text-xs font-medium text-center">{img.error}</p>
                </div>
              )}
              {!img.uploading && (
                <>
                  <button
                    type="button"
                    onClick={() => remove(img)}
                    className="absolute top-1.5 right-1.5 size-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                  {!img.error && !img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(img.localId)}
                      className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold rounded-full transition-colors"
                    >
                      <Star className="size-2.5" />
                      Đặt chính
                    </button>
                  )}
                  {img.isPrimary && !img.error && (
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 bg-rausch text-white text-[10px] font-semibold rounded-full">
                      <Star className="size-2.5 fill-white" />
                      Ảnh chính
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {successCount < MAX_FILES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-4/3 rounded-[10px] border-2 border-dashed border-hairline-gray hover:border-ash-gray bg-soft-cloud hover:bg-white flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <Upload className="size-5 text-stone-gray" />
              <span className="text-xs text-ash-gray font-medium">Thêm ảnh</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── page skeleton ────────────────────────────────────────────────────────────

function EditSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-soft-cloud" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-soft-cloud rounded" />
          <div className="h-3 w-56 bg-soft-cloud rounded" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-card border border-hairline-gray p-6 space-y-4">
          <div className="h-4 w-32 bg-soft-cloud rounded" />
          <div className="h-10 bg-soft-cloud rounded-lg" />
          <div className="h-10 bg-soft-cloud rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: propertyData, isLoading, isError } = useProperty(id);
  const { mutate: updateProperty, isPending } = useUpdateProperty();

  const [images, setImages] = useState<LocalImage[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [initialized, setInitialized] = useState(false);

  const property = propertyData?.data?.property;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({ resolver: zodResolver(schema) as any });

  // Pre-populate form once property is loaded
  useEffect(() => {
    if (!property || initialized) return;

    reset({
      title:       property.title,
      type:        property.type,
      status:      (property.status === 'rented' ? 'available' : property.status) as 'available' | 'maintenance',
      price:       property.price,
      area:        property.area,
      bedrooms:    property.bedrooms,
      bathrooms:   property.bathrooms,
      description: property.description ?? '',
      address: {
        city:     property.address.city,
        district: property.address.district,
        ward:     property.address.ward ?? '',
        street:   property.address.street ?? '',
      },
      contactName:  property.contact?.name ?? '',
      contactPhone: property.contact?.phone ?? '',
    });

    setImages(propertyImagesToLocal(property.images ?? []));
    setAmenities(property.amenities ?? []);
    setInitialized(true);
  }, [property, initialized, reset]);

  const selectedType   = watch('type');
  const selectedStatus = watch('status');

  const toggleAmenity = (name: string) =>
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );

  const onSubmit = (values: FormValues) => {
    setSubmitError('');

    const readyImages = images.filter((i) => !i.uploading && !i.error);
    if (readyImages.length === 0) { setSubmitError('Vui lòng giữ lại hoặc tải lên ít nhất 1 ảnh'); return; }
    if (images.some((i) => i.uploading)) { setSubmitError('Vui lòng chờ ảnh upload xong'); return; }

    const hasPrimary = readyImages.some((i) => i.isPrimary);
    const finalImages = readyImages.map((img, idx) => ({
      url:       img.url,
      isPrimary: hasPrimary ? img.isPrimary : idx === 0,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      title:       values.title,
      type:        values.type,
      status:      values.status,
      price:       values.price,
      area:        values.area,
      ...(values.bedrooms  !== undefined && { bedrooms:  values.bedrooms }),
      ...(values.bathrooms !== undefined && { bathrooms: values.bathrooms }),
      ...(values.description && { description: values.description }),
      address: {
        city:     values.address.city,
        district: values.address.district,
        ...(values.address.ward   && { ward:   values.address.ward }),
        ...(values.address.street && { street: values.address.street }),
      },
      ...(values.contactName || values.contactPhone
        ? { contact: { name: values.contactName ?? '', phone: values.contactPhone ?? '' } }
        : {}),
      amenities: amenities,
      images:    finalImages,
    };

    updateProperty({ id, data: payload }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: propertyKeys.mine() });
        router.push('/hosting/listings');
      },
      onError: () => setSubmitError('Cập nhật thất bại, vui lòng thử lại'),
    });
  };

  if (isLoading) return <EditSkeleton />;

  if (isError || !property) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-sm font-medium text-ash-gray mb-4">Không tìm thấy tin đăng.</p>
        <Link
          href="/hosting/listings"
          className="px-4 py-2 text-sm font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/hosting/listings"
          className="size-9 flex items-center justify-center rounded-full border border-hairline-gray hover:bg-soft-cloud transition-colors"
        >
          <ArrowLeft className="size-4 text-ink-black" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink-black">Chỉnh sửa tin đăng</h1>
          <p className="text-sm text-ash-gray mt-0.5 line-clamp-1">{property.title}</p>
        </div>
      </div>

      {/* Images */}
      <SectionCard title="Ảnh bất động sản">
        <p className="text-sm text-ash-gray mb-4">
          Ảnh hiện tại được giữ lại. Bạn có thể xoá hoặc thêm ảnh mới.
        </p>
        <ImageUploader images={images} setImages={setImages} />
      </SectionCard>

      {/* Basic info */}
      <SectionCard title="Thông tin cơ bản">
        <div className="space-y-5">
          <InputField label="Tiêu đề" required error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="VD: Phòng trọ rộng rãi gần ĐH Bách Khoa, đầy đủ nội thất"
              className={inputCls}
            />
          </InputField>

          <InputField label="Loại bất động sản" required error={errors.type?.message}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
              {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('type', value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-[12px] border-2 transition-all text-sm font-medium',
                    selectedType === value
                      ? 'border-ink-black bg-ink-black text-white'
                      : 'border-hairline-gray text-ash-gray hover:border-ash-gray hover:text-ink-black',
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </InputField>

          <InputField label="Trạng thái" required error={errors.status?.message}>
            <div className="flex gap-3 mt-1">
              {STATUS_OPTIONS.map(({ value, label, cls }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('status', value)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all',
                    selectedStatus === value ? cls : 'border-hairline-gray text-ash-gray hover:border-ash-gray',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {property.status === 'rented' && (
              <p className="mt-1.5 text-xs text-ash-gray">
                Phòng đang được thuê — trạng thái sẽ tự động cập nhật khi hợp đồng kết thúc.
              </p>
            )}
          </InputField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Giá thuê (VNĐ/tháng)" required error={errors.price?.message} hint="VD: 3500000">
              <div className="relative">
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="3500000"
                  className={cn(inputCls, 'pr-16')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ash-gray font-medium">₫/tháng</span>
              </div>
            </InputField>

            <InputField label="Diện tích" required error={errors.area?.message}>
              <div className="relative">
                <input
                  {...register('area', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="25"
                  className={cn(inputCls, 'pr-10')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ash-gray font-medium">m²</span>
              </div>
            </InputField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Phòng ngủ" error={errors.bedrooms?.message}>
              <input {...register('bedrooms', { valueAsNumber: true })} type="number" min={0} max={20} placeholder="0" className={inputCls} />
            </InputField>
            <InputField label="Phòng tắm" error={errors.bathrooms?.message}>
              <input {...register('bathrooms', { valueAsNumber: true })} type="number" min={0} max={20} placeholder="1" className={inputCls} />
            </InputField>
          </div>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Địa chỉ">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Thành phố / Tỉnh" required error={errors.address?.city?.message}>
              <input {...register('address.city')} placeholder="TP. Hồ Chí Minh" className={inputCls} />
            </InputField>
            <InputField label="Quận / Huyện" required error={errors.address?.district?.message}>
              <input {...register('address.district')} placeholder="Quận 1" className={inputCls} />
            </InputField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Phường / Xã" error={errors.address?.ward?.message}>
              <input {...register('address.ward')} placeholder="Phường Bến Nghé" className={inputCls} />
            </InputField>
            <InputField label="Số nhà, tên đường" error={errors.address?.street?.message}>
              <input {...register('address.street')} placeholder="123 Nguyễn Huệ" className={inputCls} />
            </InputField>
          </div>
        </div>
      </SectionCard>

      {/* Description & Amenities */}
      <SectionCard title="Mô tả & Tiện nghi">
        <div className="space-y-5">
          <InputField label="Mô tả" error={errors.description?.message} hint="Mô tả chi tiết về phòng, vị trí, xung quanh, quy định...">
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Phòng thoáng mát, sạch sẽ, an ninh tốt..."
              className={cn(inputCls, 'resize-none')}
            />
          </InputField>

          <div>
            <label className="block text-sm font-semibold text-ink-black mb-3">Tiện nghi có sẵn</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => {
                const active = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-full border transition-all',
                      active
                        ? 'bg-ink-black text-white border-ink-black'
                        : 'bg-white text-ash-gray border-hairline-gray hover:border-ash-gray hover:text-ink-black',
                    )}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Tên liên hệ" error={errors.contactName?.message}>
              <input {...register('contactName')} placeholder="Nguyễn Văn A" className={inputCls} />
            </InputField>
            <InputField label="Số điện thoại" error={errors.contactPhone?.message} hint="Để người thuê liên hệ trực tiếp">
              <input {...register('contactPhone')} type="tel" placeholder="0901234567" className={inputCls} />
            </InputField>
          </div>
        </div>
      </SectionCard>

      {/* Sticky submit bar */}
      <div className="sticky bottom-0 -mx-8 px-8 py-4 bg-white border-t border-hairline-gray flex items-center justify-between gap-4">
        {submitError ? (
          <p className="text-sm text-error-red font-medium">{submitError}</p>
        ) : (
          <p className="text-sm text-ash-gray">
            {images.filter((i) => !i.uploading && !i.error).length} ảnh
            {amenities.length > 0 && ` · ${amenities.length} tiện nghi`}
          </p>
        )}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/hosting/listings"
            className="px-5 py-2.5 text-sm font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
          >
            Huỷ
          </Link>
          <button
            type="submit"
            disabled={isPending || images.some((i) => i.uploading)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-rausch hover:bg-deep-rausch disabled:opacity-50 rounded-lg transition-all active:scale-95"
          >
            {isPending
              ? <><Loader2 className="size-4 animate-spin" />Đang lưu...</>
              : 'Lưu thay đổi'
            }
          </button>
        </div>
      </div>
    </form>
  );
}
