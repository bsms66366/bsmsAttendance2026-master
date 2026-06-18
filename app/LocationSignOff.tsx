import { LocationSignOffSignature, LocationSignOffSignatureRef } from '@/components/LocationSignOffSignature';
import { useThemeColor } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../context/AuthProvider';
import axiosConfig from '../helpers/axiosConfig';
import { OFFLINE_QUEUE_ENABLED } from '../helpers/featureFlags';

type Practice = {
  id: string;
  name: string;
};

type LocationItem = {
  id: string;
  name: string;
  barcode?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postcode?: string;
};

type SignoffQueueStatus = 'pending_local' | 'pending_server' | 'saved';

type SignoffQueueItem = {
  local_id: string;
  location_id: string;
  location_barcode: string;
  bsms_id: string;
  reg_number_of_approver: string;
  signoff_name: string;
  location_postcode?: string;
  data?: string;
  status: SignoffQueueStatus;
  created_at: string;
  saved_at?: string;
  submit_attempts: number;
  next_retry_at?: string;
  last_attempt_at?: string;
  error_message?: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const SIGNOFF_QUEUE_KEY = 'location_signoff_submission_queue_v1';
const SIGNOFF_SYNC_INTERVAL_MS = 5000;
const SIGNOFF_MAX_RETRY_ATTEMPTS = 6;
const SIGNOFF_MAX_RETRY_DELAY_MS = 60000;
const SIGNOFF_503_PAUSE_MS = 60000;
const SIGNOFF_503_THRESHOLD = 3;

const stripDataUrlPrefix = (raw: string) => {
  const marker = 'base64,';
  const index = raw.indexOf(marker);
  if (index === -1) return raw;
  return raw.slice(index + marker.length);
};

const getBackendMessage = (error: any) => {
  const data = error?.response?.data;
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return '';
};

const buildSubmitFailureAlert = (error: any) => {
  const status = error?.response?.status;
  const backendMessage = getBackendMessage(error);

  if (status === 503) {
    return {
      title: 'Server temporarily unavailable',
      message:
        'The placements server is currently unavailable, so this sign-off could not be submitted. Please wait a minute and try again. Your details are still on this form.',
    };
  }

  if (status === 422) {
    return {
      title: 'Could not submit sign-off',
      message: backendMessage || 'Some details were rejected by the server. Please review the form and try again.',
    };
  }

  if (!error?.response) {
    return {
      title: 'Connection problem',
      message: 'Could not reach the server. Check your internet connection and try again.',
    };
  }

  return {
    title: 'Submit failed',
    message: backendMessage || 'Could not submit sign-off right now. Please try again.',
  };
};

export default function LocationSignOff() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locationBarcode?: string; postcode?: string }>();
  const { user } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = useThemeColor({}, 'primary');

  const [locationBarcode, setLocationBarcode] = useState('');
  const [scanPostcode, setScanPostcode] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [regNumberOfApprover, setRegNumberOfApprover] = useState('');
  const [signOffName, setSignOffName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const signatureRef = useRef<LocationSignOffSignatureRef>(null);
  const [signoffQueue, setSignoffQueue] = useState<SignoffQueueItem[]>([]);
  const [queueHydrated, setQueueHydrated] = useState(false);
  const [retryPausedUntil, setRetryPausedUntil] = useState(0);
  const queueRef = useRef<SignoffQueueItem[]>([]);
  const syncInProgressRef = useRef(false);
  const serverPauseUntilRef = useRef(0);
  const consecutive503Ref = useRef(0);

  const getRetryDelayMs = useCallback((attempts: number) => {
    const baseDelay = 5000;
    const exponent = Math.max(0, attempts - 1);
    return Math.min(SIGNOFF_MAX_RETRY_DELAY_MS, baseDelay * (2 ** exponent));
  }, []);

  const DRAFT_CACHE_KEY = 'location_signoff_draft_v1';


  const normalizeBarcode = useCallback((value: unknown) => {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rawDraft = await AsyncStorage.getItem(DRAFT_CACHE_KEY);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (typeof draft?.locationBarcode === 'string') {
            setLocationBarcode((prev) => (prev ? prev : draft.locationBarcode));
          }
          if (typeof draft?.selectedLocationId === 'string') setSelectedLocationId(draft.selectedLocationId);
          if (typeof draft?.regNumberOfApprover === 'string') setRegNumberOfApprover(draft.regNumberOfApprover);
          if (typeof draft?.signOffName === 'string') setSignOffName(draft.signOffName);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const incoming = params?.locationBarcode;
    if (typeof incoming !== 'string') return;
    const normalized = incoming.trim();
    if (!normalized) return;
    setLocationBarcode(normalized);
  }, [params?.locationBarcode]);

  useEffect(() => {
    const incoming = params?.postcode;
    if (typeof incoming !== 'string') return;
    const normalized = incoming.trim();
    if (!normalized) return;
    setScanPostcode(normalized);
  }, [params?.postcode]);

  useEffect(() => {
    const payload = {
      locationBarcode,
      scanPostcode,
      selectedLocationId,
      regNumberOfApprover,
      signOffName,
    };
    AsyncStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [locationBarcode, regNumberOfApprover, scanPostcode, selectedLocationId, signOffName]);

  useEffect(() => {
    console.log('user keys', user);
  }, [user]);

  useEffect(() => {
    if (!OFFLINE_QUEUE_ENABLED) {
      setSignoffQueue([]);
      setQueueHydrated(true);
      return;
    }

    let active = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SIGNOFF_QUEUE_KEY);
        if (!active) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSignoffQueue(parsed);
          }
        }
        setQueueHydrated(true);
      } catch {
        if (!active) return;
        setSignoffQueue([]);
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
    AsyncStorage.setItem(SIGNOFF_QUEUE_KEY, JSON.stringify(signoffQueue)).catch(() => {});
  }, [queueHydrated, signoffQueue]);

  useEffect(() => {
    queueRef.current = signoffQueue;
  }, [signoffQueue]);



const clearSignature = useCallback(() => {
  signatureRef.current?.clear();
}, []);

  const SIGNATURE_ENABLED = true;

  const onReset = () => {
    setLocationBarcode('');
    setRegNumberOfApprover('');
    setSignOffName('');
    clearSignature();
  };

  const resolvedBsmsId = useCallback(() => {
    const candidate = (user as any)?.bsms_id ?? (user as any)?.bsmsId ?? (user as any)?.student_id ?? user?.id;
    return candidate === undefined || candidate === null ? '' : String(candidate);
  }, [user]);

  const resolvedLocationId = useCallback(() => {
    const candidate = (user as any)?.locations_id ?? (user as any)?.location_id ?? (user as any)?.locationId;
    return candidate === undefined || candidate === null ? '' : String(candidate);
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosConfig.get('/locations2025');
        const payload = res?.data;
        const arr = Array.isArray(payload)
          ? payload
          : (Array.isArray((payload as any)?.results)
            ? (payload as any).results
            : (Array.isArray((payload as any)?.data)
              ? (payload as any).data
              : (Array.isArray((payload as any)?.items) ? (payload as any).items : [])));
        const next: LocationItem[] = arr
          .map((x: any) => ({
            id: String(x?.id ?? x?.ID ?? ''),
            name: String(
              x?.name ??
              x?.Name ??
              x?.location_name ??
              x?.locationName ??
              x?.LocationName ??
              x?.practice_name ??
              x?.practiceName ??
              x?.PracticeName ??
              x?.site_name ??
              x?.siteName ??
              ''
            ),
            barcode: typeof x?.locationBarcode === 'string'
              ? x.locationBarcode
              : (typeof x?.location_barcode === 'string'
                ? x.location_barcode
                : (typeof x?.BarcodeNo === 'string'
                  ? x.BarcodeNo
                  : (typeof x?.barcode_no === 'string'
                    ? x.barcode_no
                : (typeof x?.barcode === 'string'
                  ? x.barcode
                  : (typeof x?.code === 'string' ? x.code : undefined))))),
            addressLine1: (() => {
              const candidates = [
                x?.LocationFullAddress,
                x?.location_full_address,
                x?.LocationAddress,
                x?.location_address,
                x?.address,
                x?.Address,
                x?.full_address,
                x?.fullAddress,
                x?.locationAddress,
                x?.addressLine1,
                x?.address_line1,
                x?.address1,
              ];
              const first = candidates.find((v) => typeof v === 'string' && v.trim());
              return typeof first === 'string' ? first : undefined;
            })(),
            addressLine2: typeof x?.addressLine2 === 'string' ? x.addressLine2 : (typeof x?.address_line2 === 'string' ? x.address_line2 : (typeof x?.address2 === 'string' ? x.address2 : undefined)),
            town: typeof x?.town === 'string' ? x.town : (typeof x?.city === 'string' ? x.city : (typeof x?.locality === 'string' ? x.locality : undefined)),
            postcode: typeof x?.LocationPostcode === 'string'
              ? x.LocationPostcode
              : (typeof x?.location_postcode === 'string'
                ? x.location_postcode
                : (typeof x?.postcode === 'string'
                  ? x.postcode
                  : (typeof x?.post_code === 'string'
                    ? x.post_code
                    : (typeof x?.postal_code === 'string' ? x.postal_code : undefined)))),
          }))
          .filter((x: LocationItem) => x.id);
        if (!alive) return;
        setLocations(next);
      } catch {
        if (!alive) return;
        setLocations([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const selectedLocationName = useCallback(() => {
    const id = selectedLocationId.trim();
    if (!id) return '';
    return locations.find((l) => String(l.id) === id)?.name ?? '';
  }, [locations, selectedLocationId]);

  const formatLocationAddress = useCallback((loc?: LocationItem) => {
    if (!loc) return '';

    const clean = (v?: string) => (typeof v === 'string' ? v.trim() : '');
    const normalizeText = (v: string) => v.toUpperCase().replace(/\s+/g, ' ').trim();
    const normalizePostcode = (v: string) => v.toUpperCase().replace(/\s+/g, '').trim();

    const addressLine1 = clean(loc.addressLine1);
    const addressLine2 = clean(loc.addressLine2);
    const town = clean(loc.town);
    const postcode = clean(loc.postcode);

    const parts: string[] = [];
    if (addressLine1) parts.push(addressLine1);
    if (addressLine2) parts.push(addressLine2);

    const combined = normalizeText(parts.join(', '));

    if (town) {
      const townNorm = normalizeText(town);
      if (!combined.includes(townNorm)) {
        parts.push(town);
      }
    }

    if (postcode) {
      const postNorm = normalizePostcode(postcode);
      const partsContainPost = parts.some((p) => normalizePostcode(p).includes(postNorm));
      if (!partsContainPost) {
        parts.push(postcode);
      }
    }

    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const p of parts) {
      const key = normalizeText(p);
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(p);
    }

    return deduped.join(', ');
  }, []);

  const selectedLocationAddress = useCallback(() => {
    const id = selectedLocationId.trim();
    if (!id) return '';
    const loc = locations.find((l) => String(l.id) === id);
    return formatLocationAddress(loc);
  }, [formatLocationAddress, locations, selectedLocationId]);

  const barcodeMatchedLocation = useCallback(() => {
    const barcode = normalizeBarcode(locationBarcode);
    if (!barcode) return undefined;
    const exact = locations.find((l) => normalizeBarcode(l.barcode) === barcode);
    if (exact) return exact;

    return locations.find((l) => {
      const b = normalizeBarcode(l.barcode);
      if (!b) return false;
      return b.includes(barcode) || barcode.includes(b);
    });
  }, [locationBarcode, locations, normalizeBarcode]);

  const barcodeMatchedLocations = useMemo(() => {
    const barcode = normalizeBarcode(locationBarcode);
    if (!barcode) return [] as LocationItem[];

    const exactMatches = locations.filter((l) => normalizeBarcode(l.barcode) === barcode);
    if (exactMatches.length) return exactMatches;

    return locations.filter((l) => {
      const b = normalizeBarcode(l.barcode);
      if (!b) return false;
      return b.includes(barcode) || barcode.includes(b);
    });
  }, [locationBarcode, locations, normalizeBarcode]);

  useEffect(() => {
    const barcode = normalizeBarcode(locationBarcode);
    if (!barcode) return;
    if (!locations.length) return;

    if (barcodeMatchedLocations.length === 1) {
      const only = barcodeMatchedLocations[0];
      if (only?.id && String(only.id) !== selectedLocationId) {
        setSelectedLocationId(String(only.id));
      }
    }
  }, [barcodeMatchedLocations, locationBarcode, locations.length, normalizeBarcode, selectedLocationId]);

  const locationDisplayAddress = useCallback(() => {
    const loc = barcodeMatchedLocation();
    if (loc) return formatLocationAddress(loc);
    return selectedLocationAddress();
  }, [barcodeMatchedLocation, formatLocationAddress, selectedLocationAddress]);

  const locationDisplayName = useCallback(() => {
    return (
      barcodeMatchedLocation()?.name ||
      selectedLocationName() ||
      ''
    );
  }, [barcodeMatchedLocation, selectedLocationName]);

  const postLocationSignoffWithRetry = useCallback(async (payload: any) => {
    const endpoint = '/location-signoffs'; // instead of '/submit-data'
    //const endpoint = '/submit-data'; 
    //const endpoint = '/location-signoffs';
    const fallbackSignature = stripDataUrlPrefix(String(payload?.signature_svg_base64 ?? ''));

    const attempts: { payload: any; reason: string; waitMs: number }[] = [
      { payload, reason: 'initial', waitMs: 0 },
      { payload, reason: '503-retry', waitMs: 1200 },
    ];

    if (fallbackSignature && fallbackSignature !== payload?.signature_svg_base64) {
      attempts.push({
        payload: {
          ...payload,
          signature_svg_base64: fallbackSignature,
        },
        reason: '503-fallback-signature',
        waitMs: 1600,
      });
    }

    let lastError: unknown;

    for (let i = 0; i < attempts.length; i += 1) {
      const attempt = attempts[i];
      if (attempt.waitMs > 0) {
        await wait(attempt.waitMs);
      }

      try {
        return await axiosConfig.post(endpoint, attempt.payload, {
          headers: {
            'x-client-attempt': String(i + 1),
            'x-client-attempt-reason': attempt.reason,
          },
        });
      } catch (error) {
        lastError = error;
        const status = (error as any)?.response?.status;
        const isEndpointMatch = String((error as any)?.config?.url ?? '').includes(endpoint);
        const shouldRetry = status === 503 && isEndpointMatch && i < attempts.length - 1;

        if (!shouldRetry) {
          throw error;
        }

        console.warn('[api] POST /location-signoffs 503, retrying', {
          attempt: i + 1,
          nextAttempt: i + 2,
          reason: attempts[i + 1]?.reason,
        });
      }
    }

    throw lastError;
  }, []);

  const processSignoffQueue = useCallback(async () => {
    if (!OFFLINE_QUEUE_ENABLED) return;
    if (!queueHydrated || syncInProgressRef.current) return;

    const now = Date.now();
    if (serverPauseUntilRef.current > now) return;

    syncInProgressRef.current = true;

    try {
      const snapshot = queueRef.current;
      const localOnlyItems = snapshot.filter((item) => {
        if (item.status !== 'pending_local') return false;
        if (item.submit_attempts >= SIGNOFF_MAX_RETRY_ATTEMPTS) return false;
        if (!item.next_retry_at) return true;
        const nextRetryAtMs = Date.parse(item.next_retry_at);
        return Number.isNaN(nextRetryAtMs) || nextRetryAtMs <= now;
      });

      if (localOnlyItems.length > 0) {
        const resultMap: Record<string, Partial<SignoffQueueItem>> = {};

        for (const item of localOnlyItems) {
          const payload: any = {
            location_id: item.location_id,
            location_barcode: item.location_barcode,
            bsms_id: item.bsms_id,
            reg_number_of_approver: item.reg_number_of_approver,
            signoff_name: item.signoff_name,
            ...(item.data ? { data: item.data } : {}),
            ...(item.location_postcode ? { location_postcode: item.location_postcode } : {}),
          };

          try {
            await postLocationSignoffWithRetry(payload);
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
            const canRetry = nextAttempts < SIGNOFF_MAX_RETRY_ATTEMPTS;

            resultMap[item.local_id] = {
              status: 'pending_local',
              submit_attempts: nextAttempts,
              last_attempt_at: new Date().toISOString(),
              next_retry_at: canRetry
                ? new Date(Date.now() + getRetryDelayMs(nextAttempts)).toISOString()
                : undefined,
              error_message: canRetry
                ? String(error?.message ?? 'Submit failed')
                : `Max retry attempts reached (${SIGNOFF_MAX_RETRY_ATTEMPTS}).`,
            };

            if (statusCode === 503) {
              consecutive503Ref.current += 1;

              if (consecutive503Ref.current >= SIGNOFF_503_THRESHOLD) {
                serverPauseUntilRef.current = Date.now() + SIGNOFF_503_PAUSE_MS;
                setRetryPausedUntil(serverPauseUntilRef.current);
                break;
              }
            } else {
              consecutive503Ref.current = 0;
            }
          }
        }

        setSignoffQueue((prev) =>
          prev.map((item) => {
            const update = resultMap[item.local_id];
            if (!update) return item;
            return { ...item, ...update };
          })
        );
      }

      const needsConfirmation = queueRef.current.some((item) => item.status !== 'saved');
      if (!needsConfirmation) return;

      const res = await axiosConfig.get('/location-signoffs');
      const rows = Array.isArray(res?.data) ? res.data : [];

      setSignoffQueue((prev) => {
        let changed = false;

        const next = prev.map((item) => {
          if (item.status === 'saved') return item;

          const matched = rows.some((row: any) => {
            const rowLocationId = String(row?.location_id ?? row?.locationId ?? '');
            const rowBarcode = String(row?.location_barcode ?? row?.locationBarcode ?? '');
            const rowBsmsId = String(row?.bsms_id ?? row?.bsmsId ?? '');
            const rowReg = String(row?.reg_number_of_approver ?? row?.regNumberOfApprover ?? '');
            const rowName = String(row?.signoff_name ?? row?.signOffName ?? '');
            const rowPostcode = String(row?.location_postcode ?? row?.locationPostcode ?? '').trim();
            const itemPostcode = String(item.location_postcode ?? '').trim();

            const postcodeMatches = !itemPostcode || rowPostcode === itemPostcode;

            return (
              rowLocationId === item.location_id &&
              rowBarcode === item.location_barcode &&
              rowBsmsId === item.bsms_id &&
              rowReg === item.reg_number_of_approver &&
              rowName === item.signoff_name &&
              postcodeMatches
            );
          });

          if (!matched) return item;

          changed = true;
          return {
            ...item,
            status: 'saved' as SignoffQueueStatus,
            saved_at: new Date().toISOString(),
            error_message: undefined,
          };
        });

        return changed ? next : prev;
      });
    } finally {
      syncInProgressRef.current = false;
    }
  }, [getRetryDelayMs, postLocationSignoffWithRetry, queueHydrated]);

  useEffect(() => {
    if (!OFFLINE_QUEUE_ENABLED) return;
    if (!queueHydrated) return;

    processSignoffQueue();
    const interval = setInterval(processSignoffQueue, SIGNOFF_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [processSignoffQueue, queueHydrated]);

  useEffect(() => {
    const barcode = normalizeBarcode(locationBarcode);
    if (!barcode) return;
    if (!locations.length) return;

    const match = locations.find((l) => normalizeBarcode(l.barcode) === barcode);
    if (!match) return;
    if (String(match.id) === selectedLocationId) return;
    setSelectedLocationId(String(match.id));
  }, [locationBarcode, locations, normalizeBarcode, selectedLocationId]);

  const onSubmit = useCallback(async () => {
    const bsmsId = resolvedBsmsId().trim();
    const locationId = selectedLocationId.trim();
    const barcode = locationBarcode.trim();
    const postcode = scanPostcode.trim();
    const approverReg = regNumberOfApprover.trim();
    const approverName = signOffName.trim();

    

    if (!locationId) {
      if (barcodeMatchedLocations.length > 1) {
        Alert.alert('Duplicate barcode', 'Multiple locations match this barcode. Please select the correct location.');
      } else {
        Alert.alert('Missing location', 'Please scan or enter the location barcode to set the placement.');
      }
      return;
    }

    if (!barcode) {
      Alert.alert('Missing barcode', 'Please scan or enter the location barcode.');
      return;
    }

    if (!bsmsId) {
      Alert.alert('Not logged in', 'Please log in again before submitting.');
      return;
    }

    if (!approverReg) {
      Alert.alert('Missing approver registration', 'Please enter the approver registration number.');
      return;
    }

    if (!approverName) {
      Alert.alert('Missing approver name', 'Please enter the approver name.');
      return;
    }

    let signatureBase64 = '';
    if (SIGNATURE_ENABLED) {
      if (signatureRef.current?.isEmpty()) {
        Alert.alert('Missing signature', 'Please add a signature before submitting.');
        return;
      }

      signatureBase64 = signatureRef.current?.getBase64() ?? '';
      if (!signatureBase64) {
        Alert.alert('Signature error', 'Could not encode signature. Please try again.');
        return;
      }
    }

    console.log('Signature Base64 length:', signatureBase64.length);

    try {
      const payload: any = {
        location_id: locationId,
        location_barcode: barcode,
        bsms_id: bsmsId,
        reg_number_of_approver: approverReg,
        signoff_name: approverName,
        ...(SIGNATURE_ENABLED ? { data: signatureBase64 } : {}),
        ...(postcode ? { location_postcode: postcode } : {}),
      };

      if (!OFFLINE_QUEUE_ENABLED) {
        await postLocationSignoffWithRetry(payload);
        await AsyncStorage.removeItem(DRAFT_CACHE_KEY);
        onReset();
        Alert.alert('Saved', 'Location sign-off has been submitted.');
        router.back();
        return;
      }

      const queuedRecord: SignoffQueueItem = {
        local_id: `${locationId}-${barcode}-${bsmsId}-${Date.now()}`,
        location_id: locationId,
        location_barcode: barcode,
        bsms_id: bsmsId,
        reg_number_of_approver: approverReg,
        signoff_name: approverName,
        ...(SIGNATURE_ENABLED ? { data: signatureBase64 } : {}),
        ...(postcode ? { location_postcode: postcode } : {}),
        status: 'pending_local',
        created_at: new Date().toISOString(),
        submit_attempts: 0,
      };

      setSignoffQueue((prev) => {
        const hasOpenDuplicate = prev.some(
          (item) =>
            item.status !== 'saved' &&
            item.location_id === queuedRecord.location_id &&
            item.location_barcode === queuedRecord.location_barcode &&
            item.bsms_id === queuedRecord.bsms_id
        );

        if (hasOpenDuplicate) return prev;
        return [queuedRecord, ...prev].slice(0, 50);
      });

      await AsyncStorage.removeItem(DRAFT_CACHE_KEY);
      onReset();
      Alert.alert('Saved locally', 'Location sign-off saved locally and will upload automatically.');
      router.back();
      processSignoffQueue();
    } catch (error: any) {
      if (!OFFLINE_QUEUE_ENABLED) {
        const failure = buildSubmitFailureAlert(error);
        Alert.alert(failure.title, failure.message);
        return;
      }

      Alert.alert('Save failed', 'Could not save sign-off locally. Please try again.');
    }
  }, [barcodeMatchedLocations.length, locationBarcode, onReset, processSignoffQueue, regNumberOfApprover, resolvedBsmsId, router, scanPostcode, selectedLocationId, signOffName]);

  const pendingCount = useMemo(
    () => signoffQueue.filter((item) => item.status !== 'saved').length,
    [signoffQueue]
  );

  const pendingLocalCount = useMemo(
    () => signoffQueue.filter((item) => item.status === 'pending_local').length,
    [signoffQueue]
  );

  const hasSavedItems = useMemo(
    () => signoffQueue.some((item) => item.status === 'saved'),
    [signoffQueue]
  );

  const isRetryPaused = retryPausedUntil > Date.now();

  const onScanLocationBarcode = () => {
    router.replace({
      pathname: '/(Auth)/ScanQRScreen6',
      params: { returnTo: '/LocationSignOff' },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <Image
          source={require('../assets/images/BSMS_logo_WO.png')}
          style={styles.headerLogo}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel="Brighton and Sussex Medical School"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isSigning}
        >
          {pendingCount > 0 ? (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingBannerTitle}>Sign-off pending</Text>
              <Text style={styles.pendingBannerText}>
                {pendingLocalCount > 0
                  ? `${pendingLocalCount} ${pendingLocalCount === 1 ? 'entry is' : 'entries are'} saved locally and waiting to upload.`
                  : `${pendingCount} sign-off ${pendingCount === 1 ? 'entry is' : 'entries are'} uploaded and awaiting confirmation.`}
              </Text>
            </View>
          ) : hasSavedItems ? (
            <View style={styles.savedBanner}>
              <Text style={styles.savedBannerTitle}>All sign-offs saved</Text>
              <Text style={styles.savedBannerText}>Your queued sign-off submissions have been recorded.</Text>
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

          <Text style={[styles.label, styles.mt, { color: textColor }]}>Location</Text>
          {locationDisplayName() ? (
            <View>
              <Text style={[styles.inlineNote, colorScheme === 'dark' && { color: accentColor }]}>{locationDisplayName()}</Text>
              {!!locationDisplayAddress() && (
                <Text style={[styles.inlineNote, colorScheme === 'dark' && { color: accentColor }]}>{locationDisplayAddress()}</Text>
              )}
            </View>
          ) : (
            <Text style={[styles.inlineNote, colorScheme === 'dark' && { color: accentColor }]}>
              Scan a location barcode to load placement details.
            </Text>
          )}

          {barcodeMatchedLocations.length > 1 ? (
            <View style={styles.duplicateMatchesBox}>
              <Text style={[styles.inlineNote, colorScheme === 'dark' && { color: accentColor }]}>Multiple locations match this barcode. Tap one:</Text>
              {barcodeMatchedLocations.map((loc: LocationItem) => {
                const isSelected = String(loc.id) === selectedLocationId;
                return (
                  <TouchableOpacity
                    key={String(loc.id)}
                    style={[styles.matchRow, isSelected && styles.matchRowSelected]}
                    onPress={() => setSelectedLocationId(String(loc.id))}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${loc.name}`}
                  >
                    <Text style={styles.matchTitle}>{loc.name} (ID: {String(loc.id)})</Text>
                    <Text style={[styles.matchSubtitle, colorScheme === 'dark' && { color: accentColor }]}>{formatLocationAddress(loc)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <Text style={[styles.label, styles.mt, { color: textColor }]}>LocationBarcode</Text>
          <TextInput
            value={locationBarcode}
            onChangeText={setLocationBarcode}
            style={styles.input}
            placeholder=""
            placeholderTextColor="#9aa3ab"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.scanButton}
            onPress={onScanLocationBarcode}
            accessibilityRole="button"
            accessibilityLabel="Scan Location Barcode"
          >
            <Text style={styles.scanButtonText}>Scan Location Barcode</Text>
          </TouchableOpacity>

          <Text style={[styles.label, styles.mt, { color: textColor }]}>RegNumberOfApprover</Text>
          <TextInput
            value={regNumberOfApprover}
            onChangeText={setRegNumberOfApprover}
            style={styles.input}
            placeholder="E.g. GMC or NMC number"
            placeholderTextColor="#9aa3ab"
            autoCapitalize="characters"
          />

          <Text style={[styles.label, styles.mt, { color: textColor }]}>SignOffName</Text>
          <TextInput
            value={signOffName}
            onChangeText={setSignOffName}
            style={styles.input}
            placeholder="Name of approver"
            placeholderTextColor="#9aa3ab"
            autoCapitalize="words"
          />

          {SIGNATURE_ENABLED && (
            <LocationSignOffSignature
              ref={signatureRef}
              onSigningChange={setIsSigning}
              labelColor={textColor}
            />
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: primaryColor },
                colorScheme === 'dark' && { borderWidth: 2, borderColor: accentColor }
              ]}
              onPress={onReset}
              accessibilityRole="button"
              accessibilityLabel="Reset"
            >
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: accentColor }]}
              onPress={onSubmit}
              accessibilityRole="button"
              accessibilityLabel="Submit"
            >
              <Text style={[styles.actionButtonText, { color: primaryColor }]}>Submit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scrollSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLogo: {
    height: 44,
    width: 280,
  },
  container: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  label: {
    color: '#59636d',
    fontSize: 16,
    marginBottom: 8,
  },
  inlineNote: {
    color: '#59636d',
    fontSize: 12,
    marginBottom: 8,
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
  duplicateMatchesBox: {
    marginTop: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#c7ced6',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
  },
  matchRow: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f8fafc',
  },
  matchRowSelected: {
    borderColor: '#2f6e90',
    backgroundColor: '#eef7fb',
  },
  matchTitle: {
    color: '#1b1f23',
    fontSize: 13,
    fontWeight: '700',
  },
  matchSubtitle: {
    color: '#59636d',
    fontSize: 12,
    marginTop: 4,
  },
  mt: {
    marginTop: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7ced6',
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 2,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1b1f23',
  },
  scanButton: {
    marginTop: 18,
    alignSelf: 'center',
    backgroundColor: '#2f6e90',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e4f68',
    minWidth: 240,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollSpacer: {
    height: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 18,
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
});
