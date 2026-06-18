import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useThemeColor } from '@/components/Themed';
import { AuthContext } from '../context/AuthProvider';
import axiosConfig from '../helpers/axiosConfig';

type SessionAttendanceItem = {
  session_id?: number;
  session_title?: string;
  clinical_sub_type?: string | null;
  session_date?: string;
  bsms_id?: string | number;
  [key: string]: unknown;
};

type SignoffItem = {
  location_id?: number;
  location_barcode?: string;
  created_at?: string;
  bsms_id?: string | number;
  [key: string]: unknown;
};

type ExaminationItem = {
  id: number;
  title?: string;
  name?: string;
  station?: string;
  [key: string]: unknown;
};

type ExaminationResult = {
  examination_id?: number;
  examinationId?: number;
  is_competent?: number | boolean;
  isCompetent?: number | boolean;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
};

type CachedStats = {
  signoffs: SignoffItem[];
  sessions: SessionAttendanceItem[];
  exams: ExaminationItem[];
  examResults: ExaminationResult[];
  updatedAt: string;
};

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

export default function UserStats() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const resolvedBsmsId = useMemo(() => {
    const candidate =
      (user as any)?.bsms_id ??
      (user as any)?.bsmsId ??
      (user as any)?.student_id ??
      (user as any)?.studentId ??
      user?.id;
    return candidate === undefined || candidate === null ? '' : String(candidate);
  }, [user]);

  const storageKey = useMemo(() => {
    const id = resolvedBsmsId.trim();
    return id ? `userStats:${id}` : '';
  }, [resolvedBsmsId]);

  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [signoffs, setSignoffs] = useState<SignoffItem[]>([]);
  const [sessions, setSessions] = useState<SessionAttendanceItem[]>([]);
  const [exams, setExams] = useState<ExaminationItem[]>([]);
  const [examResults, setExamResults] = useState<ExaminationResult[]>([]);

  const loadFromCache = useCallback(async () => {
    if (!storageKey) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CachedStats;
      setSignoffs(Array.isArray(parsed?.signoffs) ? parsed.signoffs : []);
      setSessions(Array.isArray(parsed?.sessions) ? parsed.sessions : []);
      setExams(Array.isArray(parsed?.exams) ? parsed.exams : []);
      setExamResults(Array.isArray(parsed?.examResults) ? parsed.examResults : []);
      setUpdatedAt(typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : '');
    } catch {
      // ignore
    }
  }, [storageKey]);

  const fetchAndCache = useCallback(async () => {
    const bsmsId = resolvedBsmsId.trim();
    if (!bsmsId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [signoffRes, sessionRes, examRes, examResultsRes] = await Promise.all([
        axiosConfig.get('/location-signoffs'),
        axiosConfig.get(`/session-attendance?bsms_id=${encodeURIComponent(bsmsId)}`),
        axiosConfig.get('/examinations'),
        axiosConfig.get(`/examination-results?bsms_id=${encodeURIComponent(bsmsId)}`),
      ]);

      const allSignoffs = Array.isArray(signoffRes?.data) ? (signoffRes.data as SignoffItem[]) : [];
      const mySignoffs = allSignoffs.filter((s) => String((s as any)?.bsms_id ?? '') === String(bsmsId));

      const sessionsPayload = Array.isArray(sessionRes?.data) ? (sessionRes.data as SessionAttendanceItem[]) : [];
      const examsPayload = Array.isArray(examRes?.data) ? (examRes.data as ExaminationItem[]) : [];
      const examResultsPayload = Array.isArray(examResultsRes?.data) ? (examResultsRes.data as ExaminationResult[]) : [];

      setSignoffs(mySignoffs);
      setSessions(sessionsPayload);
      setExams(examsPayload);
      setExamResults(examResultsPayload);

      const nowIso = new Date().toISOString();
      setUpdatedAt(nowIso);

      if (storageKey) {
        const toCache: CachedStats = {
          signoffs: mySignoffs,
          sessions: sessionsPayload,
          exams: examsPayload,
          examResults: examResultsPayload,
          updatedAt: nowIso,
        };
        await AsyncStorage.setItem(storageKey, JSON.stringify(toCache));
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Could not load stats.';
      Alert.alert('Error', String(msg));
    } finally {
      setLoading(false);
    }
  }, [resolvedBsmsId, storageKey]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadFromCache();
      if (!alive) return;
      await fetchAndCache();
    })();
    return () => {
      alive = false;
    };
  }, [fetchAndCache, loadFromCache]);

  const examResultsByExamId = useMemo(() => {
    const mapped: Record<string, ExaminationResult> = {};
    for (const r of examResults) {
      const key = String((r as any)?.examination_id ?? (r as any)?.examinationId ?? '');
      if (key) mapped[key] = r;
    }
    return mapped;
  }, [examResults]);

  const competentCount = useMemo(() => {
    let count = 0;
    for (const exam of exams) {
      const r = examResultsByExamId[String(exam.id)];
      const isCompetent = asBool((r as any)?.is_competent ?? (r as any)?.isCompetent);
      if (isCompetent) count += 1;
    }
    return count;
  }, [examResultsByExamId, exams]);

  const totalExams = useMemo(() => exams.length, [exams.length]);

  const recentSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      const da = a?.session_date ? new Date(String(a.session_date)).getTime() : 0;
      const db = b?.session_date ? new Date(String(b.session_date)).getTime() : 0;
      return db - da;
    });
    return sorted.slice(0, 10);
  }, [sessions]);

  const recentSignoffs = useMemo(() => {
    const sorted = [...signoffs].sort((a, b) => {
      const da = a?.created_at ? new Date(String(a.created_at)).getTime() : 0;
      const db = b?.created_at ? new Date(String(b.created_at)).getTime() : 0;
      return db - da;
    });
    return sorted.slice(0, 10);
  }, [signoffs]);

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor }]}> 
        <Text style={[styles.infoTitle, { color: headingColor }]}>Student</Text>
        <Text style={[styles.infoValue, { color: textColor }]}>
          {(user as any)?.name || (user as any)?.email || (resolvedBsmsId ? 'Logged in' : 'Not logged in')}
        </Text>
        {!!resolvedBsmsId && <Text style={[styles.infoSub, { color: textColor }]}>BSMS ID: {resolvedBsmsId}</Text>}
        {!!updatedAt && <Text style={[styles.infoSub, { color: textColor }]}>Updated: {new Date(updatedAt).toLocaleString('en-GB')}</Text>}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}> 
          <Text style={[styles.statLabel, { color: textColor }]}>Session attendance</Text>
          <Text style={[styles.statValue, { color: headingColor }]}>{sessions.length}</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}> 
          <Text style={[styles.statLabel, { color: textColor }]}>Location sign-offs</Text>
          <Text style={[styles.statValue, { color: headingColor }]}>{signoffs.length}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}> 
          <Text style={[styles.statLabel, { color: textColor }]}>Exams passed</Text>
          <Text style={[styles.statValue, { color: headingColor }]}>{totalExams ? `${competentCount} / ${totalExams}` : '0'}</Text>
        </View>

        <View style={styles.buttonStack}>
          <TouchableOpacity
            onPress={fetchAndCache}
            style={[styles.refreshButton, { backgroundColor: accentColor }]}
            activeOpacity={0.85}
            disabled={!resolvedBsmsId || loading}
          >
            <Text style={[styles.refreshText, { color: buttonTextColor }]}>{loading ? 'Loading…' : 'Refresh'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { borderColor: accentColor }]} activeOpacity={0.8}>
            <Text style={[styles.backButtonText, { color: accentColor }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { borderColor }]}> 
        <Text style={[styles.sectionTitle, { color: headingColor }]}>Recent sessions</Text>
        {recentSessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: textColor }]}>No session attendance records yet.</Text>
        ) : (
          recentSessions.map((s, idx) => {
            const title = String((s as any)?.session_title ?? `Session #${(s as any)?.session_id ?? ''}`);
            const date = (s as any)?.session_date
              ? new Date(String((s as any).session_date)).toLocaleString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            return (
              <View key={`ses-${idx}`} style={[styles.rowItem, { backgroundColor: cardColor, borderColor }]}> 
                <Text style={[styles.rowTitle, { color: headingColor }]} numberOfLines={2}>
                  {title}
                </Text>
                {!!date && <Text style={[styles.rowSub, { color: textColor }]}>{date}</Text>}
              </View>
            );
          })
        )}
      </View>

      <View style={[styles.section, { borderColor }]}> 
        <Text style={[styles.sectionTitle, { color: headingColor }]}>Recent sign-offs</Text>
        {recentSignoffs.length === 0 ? (
          <Text style={[styles.emptyText, { color: textColor }]}>No sign-off records yet.</Text>
        ) : (
          recentSignoffs.map((s, idx) => {
            const barcode = String((s as any)?.location_barcode ?? '');
            const createdAt = String((s as any)?.created_at ?? '');
            return (
              <View key={`sig-${idx}`} style={[styles.rowItem, { backgroundColor: cardColor, borderColor }]}> 
                <Text style={[styles.rowTitle, { color: headingColor }]} numberOfLines={1}>
                  {barcode || 'Sign-off'}
                </Text>
                {!!createdAt && <Text style={[styles.rowSub, { color: textColor }]}>{createdAt}</Text>}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  buttonStack: {
    flex: 1,
    gap: 10,
  },
  backButton: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoSub: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.85,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.85,
  },
  statValue: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '900',
  },
  refreshButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.8,
    paddingVertical: 10,
  },
  rowItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.85,
  },
});
