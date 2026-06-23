import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMyPreferenceApi,
  upsertPreferenceApi,
  deletePreferenceApi,
  type TenantPreference,
} from "@/lib/api/preferences.api";
import { getApiErrorMessage } from "@/lib/api-error";

export const preferenceKeys = {
  mine: () => ["preferences", "mine"] as const,
};

export function useMyPreference(enabled: boolean) {
  return useQuery({
    queryKey: preferenceKeys.mine(),
    queryFn: getMyPreferenceApi,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TenantPreference, "id">) => upsertPreferenceApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: preferenceKeys.mine() });
      qc.invalidateQueries({ queryKey: ["properties", "recommendations"] });
      toast.success("Đã lưu hồ sơ tìm phòng");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Không thể lưu hồ sơ")),
  });
}

export function useDeletePreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePreferenceApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: preferenceKeys.mine() });
      qc.invalidateQueries({ queryKey: ["properties", "recommendations"] });
      toast.success("Đã xoá hồ sơ tìm phòng");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Không thể xoá hồ sơ")),
  });
}
