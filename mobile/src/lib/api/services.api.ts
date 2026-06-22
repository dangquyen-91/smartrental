import api from '@/lib/api';
import type {
  CatalogItem,
  CreateServiceOrderInput,
  ServiceOrder,
  ServiceStatus,
} from '@/types/service';
import type { Paginated } from '@/types/property';
import type { PaymentLink } from '@/lib/api/payment.api';

// GET /services → { services }
export async function getServiceCatalogApi() {
  const { data } = await api.get('/services');
  return (data.data?.services ?? data.data ?? []) as CatalogItem[];
}

// POST /services/order → { order }
export async function createServiceOrderApi(input: CreateServiceOrderInput) {
  const { data } = await api.post('/services/order', input);
  return (data.data?.order ?? data.data) as ServiceOrder;
}

// GET /services/my-orders (tenant) → R.paginated
export async function getMyServiceOrdersApi(): Promise<Paginated<ServiceOrder>> {
  const { data } = await api.get('/services/my-orders');
  return { data: data.data ?? [], pagination: data.pagination };
}

// GET /services/landlord-orders (landlord) → R.paginated
export async function getLandlordServiceOrdersApi(): Promise<Paginated<ServiceOrder>> {
  const { data } = await api.get('/services/landlord-orders');
  return { data: data.data ?? [], pagination: data.pagination };
}

// PATCH /services/order/:id → { order }
export async function updateServiceOrderStatusApi(
  id: string,
  body: { status: ServiceStatus; cancelReason?: string },
) {
  const { data } = await api.patch(`/services/order/${id}`, body);
  return (data.data?.order ?? data.data) as ServiceOrder;
}

// ─── Thanh toán dịch vụ ─────────────────────────────────────────────────────
export async function createServicePaymentApi(orderId: string) {
  const { data } = await api.post(`/payment/service/${orderId}`);
  return data.data as PaymentLink;
}

export async function getServicePaymentStatusApi(orderId: string) {
  const { data } = await api.get(`/payment/service/${orderId}/status`, {
    params: { _t: Date.now() },
  });
  return data.data as { status: string; paymentStatus: 'unpaid' | 'paid' | 'refunded' };
}
