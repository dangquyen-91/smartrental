import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { formatPrice } from '@/lib/format';
import { CLEAN_LABEL, LIFESTYLE_LABEL, SCHEDULE_LABEL } from '@/constants/roommate-meta';
import { useRoommateMatches, useSendRoommateRequest } from '@/hooks/use-roommate';
import { explainRoommateMatchApi } from '@/lib/api/roommate.api';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import type { RoommateMatch } from '@/types/roommate';

const scoreColor = (s: number) => (s >= 80 ? '#16a34a' : s >= 60 ? colors.brand : colors.muted);

export default function RoommateMatches() {
  const { data, isLoading, isError, refetch, isRefetching } = useRoommateMatches();
  const matches = data?.data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Gợi ý ghép" />

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <ListItemSkeleton />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={44} color="#c1c1c1" />
          <Text style={styles.emptyTitle}>Chưa xem được gợi ý</Text>
          <Text style={styles.emptySub}>Hãy tạo hồ sơ và bật "đang tìm" để xem gợi ý.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <MatchCard match={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={44} color="#c1c1c1" />
              <Text style={styles.emptyTitle}>Chưa có gợi ý phù hợp</Text>
              <Text style={styles.emptySub}>Thử nới ngân sách hoặc đổi tiêu chí trong hồ sơ.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function MatchCard({ match }: { match: RoommateMatch }) {
  const send = useSendRoommateRequest();
  const u = typeof match.user === 'object' ? match.user : undefined;
  const uid = u?.id ?? u?._id ?? '';

  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  const onExplain = async () => {
    if (explanation) {
      setExplanation('');
      return;
    }
    setExplaining(true);
    try {
      const res = await explainRoommateMatchApi(uid);
      setExplanation(res.explanation);
    } catch {
      setExplanation('Không tải được giải thích, thử lại sau.');
    } finally {
      setExplaining(false);
    }
  };

  const status = match.requestStatus;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          {u?.avatar ? (
            <Image source={{ uri: u.avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarTxt}>{u?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{u?.name ?? 'Người dùng'}</Text>
          {!!match.city && <Text style={styles.sub}>{match.city}</Text>}
          <Text style={styles.budget}>
            {formatPrice(match.budget.min)} – {formatPrice(match.budget.max)}đ
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor(match.matchScore) + '22' }]}>
          <Text style={[styles.scoreText, { color: scoreColor(match.matchScore) }]}>
            {match.matchScore}%
          </Text>
          <Text style={styles.scoreLabel}>hợp</Text>
        </View>
      </View>

      <View style={styles.tags}>
        <Tag text={SCHEDULE_LABEL[match.schedule]} />
        <Tag text={LIFESTYLE_LABEL[match.lifestyle]} />
        <Tag text={CLEAN_LABEL[match.cleanliness]} />
      </View>

      {!!match.bio && <Text style={styles.bio} numberOfLines={2}>{match.bio}</Text>}

      {!!explanation && (
        <View style={styles.explainBox}>
          <View style={styles.explainHead}>
            <Ionicons name="sparkles" size={14} color={colors.brand} />
            <Text style={styles.explainTitle}>AI phân tích độ hợp</Text>
          </View>
          <Text style={styles.explainText}>{explanation}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <PressableScale style={styles.aiBtn} haptic disabled={explaining} onPress={onExplain}>
          {explaining ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={15} color={colors.brand} />
              <Text style={styles.aiText}>{explanation ? 'Ẩn' : 'AI giải thích'}</Text>
            </>
          )}
        </PressableScale>

        {status === 'accepted' ? (
          <View style={styles.matchedTag}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={styles.matchedText}>Đã ghép</Text>
          </View>
        ) : status === 'pending' ? (
          <View style={styles.sentTag}>
            <Text style={styles.sentText}>Đã gửi lời mời</Text>
          </View>
        ) : (
          <Pressable
            style={styles.sendBtn}
            disabled={send.isPending || !uid}
            onPress={() => send.mutate({ userId: uid })}
          >
            <Text style={styles.sendText}>Gửi lời mời</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 10, ...shadow.card },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  budget: { fontSize: 13, fontWeight: '700', color: colors.brand, marginTop: 2 },
  scoreBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md },
  scoreText: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { fontSize: 10, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  bio: { fontSize: 13.5, color: colors.text, lineHeight: 19 },
  explainBox: { backgroundColor: '#fffbe6', borderRadius: radius.md, padding: 12, gap: 6 },
  explainHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  explainTitle: { fontSize: 12, fontWeight: '800', color: colors.brand },
  explainText: { fontSize: 13.5, color: colors.text, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  aiText: { fontSize: 13, fontWeight: '700', color: colors.brand },
  sendBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  sendText: { fontSize: 14, fontWeight: '800', color: colors.accentText },
  sentTag: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  sentText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  matchedTag: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingVertical: 11 },
  matchedText: { fontSize: 14, fontWeight: '800', color: '#16a34a' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 30 },
});
