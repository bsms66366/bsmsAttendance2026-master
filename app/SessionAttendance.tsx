import { useThemeColor } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthProvider';
import axiosConfig from '../helpers/axiosConfig';
import { OFFLINE_QUEUE_ENABLED } from '../helpers/featureFlags';

type SessionItem = {
  id: number;
  module_code: string;
  session_title: string;
  clinical_sub_type: string | null;
};

type GroupedSessions = Record<string, SessionItem[]>;

type SubmissionStatus = 'pending_local' | 'pending_server' | 'saved';

type SubmissionQueueItem = {
  local_id: string;
  bsms_id: string;
  session_id: number;
  session_date: string;
  status: SubmissionStatus;
  created_at: string;
  saved_at?: string;
  submit_attempts: number;
  next_retry_at?: string;
  last_attempt_at?: string;
  error_message?: string;
};

const SUBMISSION_QUEUE_KEY = 'session_attendance_submission_queue_v1';
const SUBMISSION_SYNC_INTERVAL_MS = 5000;
const SUBMISSION_MAX_RETRY_ATTEMPTS = 6;
const SUBMISSION_MAX_RETRY_DELAY_MS = 60000;
const SUBMISSION_503_PAUSE_MS = 60000;
const SUBMISSION_503_THRESHOLD = 3;

export default function SessionAttendance() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; locationBarcode?: string }>();
  const { user } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  const [groupedSessions, setGroupedSessions] = useState<GroupedSessions>({});
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionQueue, setSubmissionQueue] = useState<SubmissionQueueItem[]>([]);
  const [queueHydrated, setQueueHydrated] = useState(false);
  const [retryPausedUntil, setRetryPausedUntil] = useState(0);
  const queueRef = useRef<SubmissionQueueItem[]>([]);
  const syncInProgressRef = useRef(false);
  const serverPauseUntilRef = useRef(0);
  const consecutive503Ref = useRef(0);

  const getRetryDelayMs = useCallback((attempts: number) => {
    const baseDelay = 5000;
    const exponent = Math.max(0, attempts - 1);
    return Math.min(SUBMISSION_MAX_RETRY_DELAY_MS, baseDelay * (2 ** exponent));
  }, []);

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
    if (!OFFLINE_QUEUE_ENABLED) {
      setSubmissionQueue([]);
      setQueueHydrated(true);
      return;
    }

    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SUBMISSION_QUEUE_KEY);
        if (!active) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSubmissionQueue(parsed);
          }
        }
        setQueueHydrated(true);
      } catch {
        if (!active) return;
        setSubmissionQueue([]);
        setQueueHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!OFFLINE_QUEUE_ENABLED) return;
    if (!queueHydrated) return;
    AsyncStorage.setItem(SUBMISSION_QUEUE_KEY, JSON.stringify(submissionQueue)).catch(() => {});
  }, [queueHydrated, submissionQueue]);

  useEffect(() => {
    queueRef.current = submissionQueue;
  }, [submissionQueue]);

  const processSubmissionQueue = useCallback(async () => {
    if (!OFFLINE_QUEUE_ENABLED) return;
    if (!queueHydrated || syncInProgressRef.current) return;

    const now = Date.now();
    if (serverPauseUntilRef.current > now) return;

    syncInProgressRef.current = true;

    try {
      const snapshot = queueRef.current;
      const localOnlyItems = snapshot.filter((item) => {
        if (item.status !== 'pending_local') return false;
        if (item.submit_attempts >= SUBMISSION_MAX_RETRY_ATTEMPTS) return false;
        if (!item.next_retry_at) return true;
        const nextRetryAtMs = Date.parse(item.next_retry_at);
        return Number.isNaN(nextRetryAtMs) || nextRetryAtMs <= now;
      });

      if (localOnlyItems.length > 0) {
        const resultMap: Record<string, Partial<SubmissionQueueItem>> = {};

        for (const item of localOnlyItems) {
          try {
            await axiosConfig.post('/save-session', {
              session_id: item.session_id,
              bsms_id: item.bsms_id,
              session_date: item.session_date,
            });

            resultMap[item.local_id] = {
              status: 'pending_server',
              submit_attempts: item.submit_attempts + 1,
              last_attempt_at: new Date().toISOString(),
              next_retry_at: undefined,
              error_message: undefined,
            };
            consecutive503Ref.current = 0;
            setRetryPausedUntil(0);
          } catch (error: any) {
            const nextAttempts = item.submit_attempts + 1;
            const statusCode = Number(error?.response?.status ?? 0);
            const canRetry = nextAttempts < SUBMISSION_MAX_RETRY_ATTEMPTS;

            resultMap[item.local_id] = {
              status: 'pending_local',
              submit_attempts: nextAttempts,
              last_attempt_at: new Date().toISOString(),
              next_retry_at: canRetry
                ? new Date(Date.now() + getRetryDelayMs(nextAttempts)).toISOString()
                : undefined,
              error_message: canRetry
                ? String(error?.message ?? 'Submit failed')
                : `Max retry attempts reached (${SUBMISSION_MAX_RETRY_ATTEMPTS}).`,
            };

            if (statusCode === 503) {
              consecutive503Ref.current += 1;

              if (consecutive503Ref.current >= SUBMISSION_503_THRESHOLD) {
                serverPauseUntilRef.current = Date.now() + SUBMISSION_503_PAUSE_MS;
                setRetryPausedUntil(serverPauseUntilRef.current);
                break;
              }
            } else {
              consecutive503Ref.current = 0;
            }
          }
        }

        setSubmissionQueue((prev) =>
          prev.map((item) => {
            const update = resultMap[item.local_id];
            if (!update) return item;
            return { ...item, ...update };
          })
        );
      }

      const needsConfirmation = queueRef.current.some((item) => item.status === 'pending_server');
      if (!needsConfirmation) return;

      const res = await axiosConfig.get('/session-attendance');
      const rows = Array.isArray(res?.data) ? res.data : [];

      setSubmissionQueue((prev) => {
        let changed = false;

        const next = prev.map((item) => {
          if (item.status === 'saved') return item;

          const matched = rows.some((row: any) => {
            const rowSessionId = Number(row?.session_id ?? row?.sessionId ?? row?.sessionID ?? row?.SessionID);
            const rowBsmsId = String(row?.bsms_id ?? row?.bsmsId ?? '');
            const rowDateRaw = String(row?.session_date ?? row?.sessionDate ?? '');
            const rowDate = rowDateRaw.slice(0, 10);

            return rowSessionId === item.session_id && rowBsmsId === item.bsms_id && rowDate === item.session_date;
          });

          if (!matched) return item;

          changed = true;
          return {
            ...item,
            status: 'saved' as SubmissionStatus,
            saved_at: new Date().toISOString(),
            error_message: undefined,
          };
        });

        return changed ? next : prev;
      });
    } finally {
      syncInProgressRef.current = false;
    }
  }, [getRetryDelayMs, queueHydrated]);

  useEffect(() => {
    if (!OFFLINE_QUEUE_ENABLED) return;
    if (!queueHydrated) return;

    processSubmissionQueue();

    const hasPendingServerItems = submissionQueue.some((item) => item.status === 'pending_server');
    if (!hasPendingServerItems) return;

    const interval = setInterval(processSubmissionQueue, SUBMISSION_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [processSubmissionQueue, queueHydrated, submissionQueue]);

  // Fetch sessions
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosConfig.get('/monitored-sessions');
        if (!alive) return;
        const data = res?.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setGroupedSessions(data as GroupedSessions);
        }
      } catch {
        if (!alive) return;
        setGroupedSessions({});
      }
    })();
    return () => { alive = false; };
  }, []);

  // Handle scanned session ID from QR
  useEffect(() => {
    const incoming = params?.sessionId || params?.locationBarcode;
    if (typeof incoming !== 'string' || !incoming.trim()) return;
    const parsed = parseInt(incoming.trim(), 10);
    if (isNaN(parsed)) {
      Alert.alert('Invalid QR', 'The scanned QR code does not contain a valid session ID.');
      return;
    }
    // Check it exists in our fetched sessions
    const allSessions = Object.values(groupedSessions).flat();
    const match = allSessions.find((s) => s.id === parsed);
    if (match) {
      setSelectedSessionId(parsed);
    } else if (allSessions.length > 0) {
      Alert.alert('Session not found', `No session matches ID "${incoming}". Please select manually.`);
    } else {
      // Sessions may not have loaded yet — set it optimistically
      setSelectedSessionId(parsed);
    }
  }, [params?.sessionId, groupedSessions]);

  const allSessions = useMemo(() => Object.values(groupedSessions).flat(), [groupedSessions]);

  const selectedSession = useMemo(
    () => allSessions.find((s) => s.id === selectedSessionId) ?? null,
    [allSessions, selectedSessionId]
  );

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const onScanQR = useCallback(() => {
    router.push({
      pathname: '/(Auth)/ScanQRScreen6',
      params: { returnTo: '/SessionAttendance', scanMode: 'qr' },
    } as any);
  }, [router]);

  const onSubmit = useCallback(async () => {
    if (!selectedSessionId) {
      Alert.alert('No session selected', 'Please scan a QR code or select a session.');
      return;
    }
    const bsmsId = resolvedBsmsId.trim();
    if (!bsmsId) {
      Alert.alert('Not logged in', 'Please log in before recording attendance.');
      return;
    }

    setSubmitting(true);
    try {
      const sessionDate = new Date().toISOString().split('T')[0];

      if (!OFFLINE_QUEUE_ENABLED) {
        await axiosConfig.post('/save-session', {
          session_id: selectedSessionId,
          bsms_id: bsmsId,
          session_date: sessionDate,
        });

        Alert.alert('Saved', `Session: ${selectedSession?.session_title ?? 'Unknown'}\nStudent: ${bsmsId}`);
        setSelectedSessionId(null);
        return;
      }

      const queuedRecord: SubmissionQueueItem = {
        local_id: `${selectedSessionId}-${sessionDate}-${Date.now()}`,
        bsms_id: bsmsId,
        session_id: selectedSessionId,
        session_date: sessionDate,
        status: 'pending_local',
        created_at: new Date().toISOString(),
        submit_attempts: 0,
      };

      setSubmissionQueue((prev) => {
        const hasOpenDuplicate = prev.some(
          (item) =>
            item.status !== 'saved' &&
            item.session_id === queuedRecord.session_id &&
            item.bsms_id === queuedRecord.bsms_id &&
            item.session_date === queuedRecord.session_date
        );

        if (hasOpenDuplicate) return prev;
        return [queuedRecord, ...prev].slice(0, 50);
      });

      Alert.alert(
        'Saved locally',
        `Session: ${selectedSession?.session_title ?? 'Unknown'}\nStudent: ${bsmsId}\nWe will submit this automatically and confirm when saved.`
      );

      setSelectedSessionId(null);
      processSubmissionQueue();
    } catch {
      Alert.alert('Submit failed', 'Could not submit attendance right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [processSubmissionQueue, resolvedBsmsId, selectedSession?.session_title, selectedSessionId]);

  const pendingCount = useMemo(
    () => submissionQueue.filter((item) => item.status !== 'saved').length,
    [submissionQueue]
  );

  const pendingLocalCount = useMemo(
    () => submissionQueue.filter((item) => item.status === 'pending_local').length,
    [submissionQueue]
  );

  const hasSavedItems = useMemo(
    () => submissionQueue.some((item) => item.status === 'saved'),
    [submissionQueue]
  );

  const isRetryPaused = retryPausedUntil > Date.now();

  const groupNames = useMemo(() => Object.keys(groupedSessions).sort(), [groupedSessions]);

  const flatListData = useMemo(() => {
    const items: { type: 'header' | 'session'; key: string; group?: string; session?: SessionItem }[] = [];
    for (const group of groupNames) {
      items.push({ type: 'header', key: `h-${group}`, group });
      for (const s of groupedSessions[group]) {
        items.push({ type: 'session', key: `s-${s.id}`, session: s });
      }
    }
    return items;
  }, [groupNames, groupedSessions]);

  const onSelectSession = useCallback((id: number) => {
    setSelectedSessionId(id);
    setDropdownVisible(false);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* <Text style={[styles.heading, { color: headingColor }]}>SESSION ATTENDANCE</Text> */}

        {/* Date */}
        <View style={[styles.dateTimeBox, { backgroundColor: primaryColor }]}> 
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {pendingCount > 0 ? (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingBannerTitle}>Submission pending</Text>
            <Text style={styles.pendingBannerText}>
              {pendingLocalCount > 0
                ? `${pendingLocalCount} ${pendingLocalCount === 1 ? 'entry is' : 'entries are'} saved locally and waiting to upload.`
                : `${pendingCount} attendance ${pendingCount === 1 ? 'entry is' : 'entries are'} uploaded and awaiting confirmation.`}
            </Text>
          </View>
        ) : hasSavedItems ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerTitle}>All submissions saved</Text>
            <Text style={styles.savedBannerText}>Your queued attendance submissions have been recorded.</Text>
          </View>
        ) : null}

        {isRetryPaused ? (
          <View style={styles.pauseBanner}>
            <Text style={styles.pauseBannerTitle}>Retry paused</Text>
            <Text style={styles.pauseBannerText}>
              We detected repeated server unavailable responses, so uploads are paused for up to 60 seconds.
            </Text>
          </View>
        ) : null}

        {/* Student info */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>
            {(user as any)?.name || (user as any)?.email || 'Not logged in'}
          </Text>
          {!!resolvedBsmsId && <Text style={styles.subValue}>BSMS ID: {resolvedBsmsId}</Text>}
        </View>

        {/* Back and Submit buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: accentColor }, (!selectedSessionId || submitting) && styles.submitDisabled]}
            onPress={onSubmit}
            activeOpacity={0.85}
            disabled={!selectedSessionId || submitting}
          >
            <Text style={[styles.actionButtonText, { color: primaryColor }]}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scan QR Button */}
        <TouchableOpacity style={[styles.scanButton, { backgroundColor: primaryColor }]} onPress={onScanQR} activeOpacity={0.85}>
          <Text style={styles.scanButtonText}>Scan Session QR</Text>
        </TouchableOpacity>

        {/* Selected session display */}
        {selectedSession && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedLabel}>Selected Session</Text>
            <Text style={styles.selectedTitle}>{selectedSession.session_title}</Text>
            {!!selectedSession.clinical_sub_type && (
              <Text style={styles.selectedSub}>{selectedSession.clinical_sub_type}</Text>
            )}
            {!!selectedSession.module_code && (
              <Text style={styles.selectedSub}>{selectedSession.module_code}</Text>
            )}
          </View>
        )}

        {/* Dropdown picker button */}
        <Text style={[styles.label, styles.mt, { color: textColor }]}>Or select a session:</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.dropdownButtonText}>
            {selectedSession ? selectedSession.session_title : 'Tap to choose a session...'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Session dropdown modal */}
        <Modal visible={dropdownVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Session</Text>
              <View style={styles.listContainer}>
                {flatListData.length === 0 ? (
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={[styles.subValue, { textAlign: 'center' }]}>
                      {allSessions.length === 0 ? 'Loading sessions...' : 'No sessions available'}
                    </Text>
                  </View>
                ) : (
                  <FlashList
                    data={flatListData}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => {
                      if (item.type === 'header') {
                        return <Text style={styles.groupHeader}>{item.group}</Text>;
                      }
                      const s = item.session!;
                      const isSelected = s.id === selectedSessionId;
                      return (
                        <TouchableOpacity
                          style={[styles.sessionRow, isSelected && styles.sessionRowSelected]}
                          onPress={() => onSelectSession(s.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.sessionTitle, isSelected && styles.sessionTitleSelected]}>
                            {s.session_title}
                          </Text>
                          {!!s.module_code && (
                            <Text style={styles.sessionModule}>{s.module_code}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setDropdownVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  dateTimeBox: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingBanner: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffd54f',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  pendingBannerTitle: {
    color: '#8a6d00',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingBannerText: {
    color: '#7a6200',
    fontSize: 13,
    marginTop: 2,
  },
  savedBanner: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  savedBannerTitle: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '700',
  },
  savedBannerText: {
    color: '#1b5e20',
    fontSize: 13,
    marginTop: 2,
  },
  pauseBanner: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffb74d',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  pauseBannerTitle: {
    color: '#e65100',
    fontSize: 14,
    fontWeight: '700',
  },
  pauseBannerText: {
    color: '#bf360c',
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7ced6',
  },
  label: {
    color: '#59636d',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    color: '#1b1f23',
    fontSize: 16,
    fontWeight: '600',
  },
  subValue: {
    color: '#59636d',
    fontSize: 13,
    marginTop: 2,
  },
  scanButton: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e4f68',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  selectedLabel: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selectedTitle: {
    color: '#1b5e20',
    fontSize: 17,
    fontWeight: '700',
  },
  selectedSub: {
    color: '#388e3c',
    fontSize: 13,
    marginTop: 2,
  },
  mt: {
    marginTop: 8,
  },
  dropdownButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c7ced6',
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    color: '#1b1f23',
    fontSize: 15,
    flex: 1,
  },
  dropdownArrow: {
    color: '#59636d',
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f3f5f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingTop: 16,
    paddingBottom: 30,
  },
  modalTitle: {
    color: '#005e7e',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c7ced6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1b1f23',
    marginBottom: 8,
  },
  modalCloseButton: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: '#2f5f7a',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  groupHeader: {
    backgroundColor: '#005e7e',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  sessionRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#c7ced6',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sessionRowSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  sessionTitle: {
    color: '#1b1f23',
    fontSize: 15,
    fontWeight: '500',
  },
  sessionTitleSelected: {
    color: '#1b5e20',
    fontWeight: '700',
  },
  sessionModule: {
    color: '#59636d',
    fontSize: 12,
    marginTop: 2,
  },
  spacer: {
    height: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 18,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitDisabled: {
    opacity: 0.5,
  },
});
