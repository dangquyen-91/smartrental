import api from '@/lib/axios';
import type { ApiResponse } from '@/types';

export interface UploadedImage {
  url: string;
  publicId: string;
}

export async function uploadImagesApi(files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const res = await api.post<ApiResponse<{ images: UploadedImage[]; count: number }>>(
    '/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data.data.images;
}

export async function deleteUploadedImageApi(publicId: string): Promise<void> {
  await api.delete('/upload', { data: { publicId } });
}
