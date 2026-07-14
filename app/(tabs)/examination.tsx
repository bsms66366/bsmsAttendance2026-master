import { useThemeColor } from '@/components/Themed';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthContext } from '../../context/AuthProvider';
import axiosConfig from '../../helpers/axiosConfig';

type ExaminationItem = {
  id: number;
  examination: string;
  category: string | null;
  sort_order: number;
  active: number;
};

type ExaminationResult = {
  id: number;
  examination_id: number;
  bsms_id: string;
  is_competent: number;
  assessor_name?: string | null;
  assessor_reg_number?: string | null;
  signature_svg?: string | null;
  assessed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FilterMode = 'all' | 'competent' | 'not_yet';

export default function ExaminationScreen() {
  const { user } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<ExaminationItem[]>([]);
  const [resultsByExamId, setResultsByExamId] = useState<Record<string, ExaminationResult>>({});

  const resolvedBsmsId = useMemo(() => {
    const candidate =
      (user as any)?.bsms_id ??
      (user as any)?.bsmsId ??
      (user as any)?.student_id ??
      (user as any)?.studentId ??
      user?.id;
    return candidate === undefined || candidate === null ? '' : String(candidate);
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [examRes, resultsRes] = await Promise.all([
          axiosConfig.get('/examinations'),
          resolvedBsmsId ? axiosConfig.get(`/examination-results?bsms_id=${encodeURIComponent(resolvedBsmsId)}`) : Promise.resolve({ data: [] }),
        ]);

        if (!alive) return;

        const examPayload = Array.isArray(examRes?.data) ? (examRes.data as ExaminationItem[]) : [];
        setItems(examPayload);

        const resultsPayload = Array.isArray(resultsRes?.data) ? (resultsRes.data as ExaminationResult[]) : [];
        const mapped: Record<string, ExaminationResult> = {};
        for (const r of resultsPayload) {
          const key = String((r as any)?.examination_id ?? (r as any)?.examinationId ?? '');
          if (key) mapped[key] = r;
        }
        setResultsByExamId(mapped);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.response?.data?.detail || e?.message || 'Could not load examinations.';
        Alert.alert('Error', String(msg));
        setItems([]);
        setResultsByExamId({});
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [resolvedBsmsId]);

  const merged = useMemo(() => {
    return items.map((it) => {
      const r = resultsByExamId[String(it.id)];
      const isCompetent = !!r?.is_competent;
      const completedAtRaw = (r as any)?.assessed_at ?? (r as any)?.assessedAt ?? (r as any)?.created_at ?? null;
      return {
        ...it,
        isCompetent,
        completedAtRaw,
      };
    });
  }, [items, resultsByExamId]);

  const filtered = useMemo(() => {
    if (filterMode === 'competent') return merged.filter((x) => x.isCompetent);
    if (filterMode === 'not_yet') return merged.filter((x) => !x.isCompetent);
    return merged;
  }, [filterMode, merged]);

  const onToggleCompetent = useCallback(
    async (item: ExaminationItem & { isCompetent: boolean }) => {
      const bsmsId = resolvedBsmsId.trim();
      if (!bsmsId) {
        Alert.alert('Not logged in', 'Please log in before recording examination results.');
        return;
      }

      const examIdKey = String(item.id);
      if (savingIds[examIdKey]) return;

      const nextCompetent = !item.isCompetent;
      setSavingIds((prev) => ({ ...prev, [examIdKey]: true }));

      try {
        const payload = {
          examination_id: item.id,
          bsms_id: bsmsId,
          is_competent: nextCompetent ? 1 : 0,
        };

        const res = await axiosConfig.post('/examination-results', payload);
        const updated = res?.data as ExaminationResult;
        setResultsByExamId((prev) => ({ ...prev, [examIdKey]: updated }));
      } catch (e: any) {
        const msg = e?.response?.data?.detail || e?.message || 'Could not save result.';
        Alert.alert('Save failed', String(msg));
      } finally {
        setSavingIds((prev) => {
          const next = { ...prev };
          delete next[examIdKey];
          return next;
        });
      }
    },
    [resolvedBsmsId, savingIds],
  );

  const formatCompletedAt = useCallback((raw: unknown) => {
    if (!raw) return '';
    try {
      const d = new Date(String(raw));
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, []);

  const renderFilterButton = useCallback(
    (mode: FilterMode, label: string) => {
      const active = filterMode === mode;
      return (
        <TouchableOpacity
          onPress={() => setFilterMode(mode)}
          style={[
            styles.filterButton,
            { borderColor: accentColor },
            active && { backgroundColor: accentColor },
          ]}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: accentColor },
              active && { color: buttonTextColor },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [accentColor, buttonTextColor, filterMode],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        {/* <Text style={[styles.heading, { color: headingColor }]}>EXAMINATION</Text> */}

        <View style={styles.filterRow}>
          {renderFilterButton('all', `All (${merged.length})`)}
          {renderFilterButton('competent', `Pass (${merged.filter((x) => x.isCompetent).length})`)}
          {renderFilterButton('not_yet', `Fail (${merged.filter((x) => !x.isCompetent).length})`)}
        </View>

        <View style={[styles.listCard, { backgroundColor: cardColor, borderColor }]}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
              <Text style={[styles.loadingText, { color: textColor }]}>Loading…</Text>
            </View>
          ) : (
            <FlashList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const examIdKey = String(item.id);
                const isSaving = !!savingIds[examIdKey];
                const completedAt = item.isCompetent ? formatCompletedAt((item as any).completedAtRaw) : '';
                return (
                  <View style={[styles.row, { borderColor }]}>
                    <View style={styles.rowTextCol}>
                      <Text style={[styles.rowTitle, { color: headingColor }]} numberOfLines={2}>
                        {item.examination}
                      </Text>
                      {!!item.category && (
                        <Text style={[styles.rowSubtitle, { color: textColor }]} numberOfLines={1}>
                          {item.category}
                        </Text>
                      )}
                      {!!completedAt && (
                        <Text style={[styles.rowMeta, { color: textColor }]} numberOfLines={1}>
                          Completed: {completedAt}
                        </Text>
                      )}
                    </View>

                    <View style={styles.rowRightCol}>
                      <Switch
                        value={item.isCompetent}
                        onValueChange={() => onToggleCompetent(item)}
                        disabled={isSaving}
                      />
                      {isSaving ? (
                        <Text style={[styles.savingText, { color: textColor }]}>Saving…</Text>
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: textColor }]}>No examinations found.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  heading: {
    fontSize: 22,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 10,
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  rowTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  rowRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  savingText: {
    fontSize: 11,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
  },
  actionButtonOutline: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  actionButtonOutlineText: {
    fontWeight: '600',
  },
});
