import type {
  Cleanliness,
  Duration,
  Gender,
  Lifestyle,
  Schedule,
  YesNo,
} from '@/types/roommate';

export const GENDER_LABEL: Record<Gender, string> = { male: 'Nam', female: 'Nữ', any: 'Bất kỳ' };
export const SCHEDULE_LABEL: Record<Schedule, string> = {
  early_bird: 'Dậy sớm',
  night_owl: 'Cú đêm',
  flexible: 'Linh hoạt',
};
export const LIFESTYLE_LABEL: Record<Lifestyle, string> = {
  quiet: 'Yên tĩnh',
  active: 'Năng động',
  mixed: 'Cân bằng',
};
export const CLEAN_LABEL: Record<Cleanliness, string> = {
  neat: 'Gọn gàng',
  average: 'Trung bình',
  relaxed: 'Thoải mái',
};
export const DURATION_LABEL: Record<Duration, string> = {
  short: 'Ngắn hạn',
  long: 'Dài hạn',
  flexible: 'Linh hoạt',
};
export const YESNO_LABEL: Record<YesNo, string> = { ok: 'Chấp nhận', no: 'Không' };

export const GENDER_OPTS = Object.keys(GENDER_LABEL) as Gender[];
export const SCHEDULE_OPTS = Object.keys(SCHEDULE_LABEL) as Schedule[];
export const LIFESTYLE_OPTS = Object.keys(LIFESTYLE_LABEL) as Lifestyle[];
export const CLEAN_OPTS = Object.keys(CLEAN_LABEL) as Cleanliness[];
export const DURATION_OPTS = Object.keys(DURATION_LABEL) as Duration[];
export const YESNO_OPTS = Object.keys(YESNO_LABEL) as YesNo[];
