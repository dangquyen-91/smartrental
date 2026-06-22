import api from '@/lib/api';

export interface UploadAsset {
  uri: string;
  name?: string | null;
  type?: string | null;
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

// Upload nhiều ảnh lên backend (multipart, field 'images'). RN cần {uri,name,type}.
export async function uploadImagesApi(assets: UploadAsset[]): Promise<UploadedImage[]> {
  const form = new FormData();
  assets.forEach((a, i) => {
    form.append('images', {
      uri: a.uri,
      name: a.name ?? `photo-${i}.jpg`,
      type: a.type ?? 'image/jpeg',
    } as unknown as Blob);
  });

  const res = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data.data.images as UploadedImage[];
}
