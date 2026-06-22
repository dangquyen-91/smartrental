import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { StarDisplay } from '@/components/star-rating';
import { usePropertyReviews } from '@/hooks/use-reviews';
import type { Review } from '@/types/review';

const fmtRelative = (s: string) => {
  const diff = Date.now() - new Date(s).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 30) return `${days} ngày trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
};

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barStar}>{star}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const reviewer = typeof review.reviewer === 'object' ? review.reviewer : null;
  const initial = reviewer?.name?.charAt(0).toUpperCase() ?? '?';
  return (
    <View style={styles.item}>
      <View style={styles.avatar}>
        {reviewer?.avatar ? (
          <Image source={{ uri: reviewer.avatar }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.itemHead}>
          <Text style={styles.reviewerName}>{reviewer?.name ?? 'Người dùng'}</Text>
          <Text style={styles.date}>{fmtRelative(review.createdAt)}</Text>
        </View>
        <StarDisplay rating={review.rating} size={13} />
        {review.comment ? (
          <Text style={styles.comment}>{review.comment}</Text>
        ) : (
          <Text style={styles.noComment}>Không có nhận xét</Text>
        )}
      </View>
    </View>
  );
}

export default function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = usePropertyReviews(propertyId);

  if (isLoading) {
    return <Text style={styles.loading}>Đang tải đánh giá...</Text>;
  }

  const total = data?.totalReviews ?? 0;
  const avg = data?.averageRating;
  const dist = data?.ratingDistribution;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Đánh giá</Text>
        {total > 0 && <Text style={styles.sectionCount}>({total})</Text>}
      </View>

      {total === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={36} color="#c1c1c1" />
          <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
          <Text style={styles.emptySub}>Hãy là người đầu tiên chia sẻ trải nghiệm!</Text>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{avg?.toFixed(1) ?? '—'}</Text>
              <StarDisplay rating={avg ?? 0} size={13} />
              <Text style={styles.scoreSub}>{total} đánh giá</Text>
            </View>
            {dist && (
              <View style={styles.bars}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar key={star} star={star} count={dist[star] ?? 0} total={total} />
                ))}
              </View>
            )}
          </View>

          <View>
            {data?.reviews?.map((r) => <ReviewItem key={r.id} review={r} />)}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { fontSize: 13, color: colors.muted, marginTop: 16 },
  section: { marginTop: 16, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionCount: { fontSize: 15, color: colors.muted },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted },
  summary: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  scoreBox: { alignItems: 'center', justifyContent: 'center', minWidth: 90, gap: 4 },
  score: { fontSize: 36, fontWeight: '800', color: colors.text, lineHeight: 40 },
  scoreSub: { fontSize: 11, color: colors.muted },
  bars: { flex: 1, justifyContent: 'center', gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barStar: { width: 12, fontSize: 12, color: colors.muted, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: '#ebebeb', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 999 },
  barCount: { width: 18, fontSize: 11, color: colors.muted },
  item: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  date: { fontSize: 11, color: colors.muted },
  comment: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 4 },
  noComment: { fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: 4 },
});
