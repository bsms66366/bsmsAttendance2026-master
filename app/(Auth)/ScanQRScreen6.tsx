import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColor } from '@/components/Themed';
import { AuthContext } from '../../context/AuthProvider';
import axiosConfig from '../../helpers/axiosConfig';

import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('attendance.db');

export default function ScanQRScreen6() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; scanMode?: string }>();
  const { user } = useContext(AuthContext);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const [scannedType, setScannedType] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'code128' | 'qr'>(params?.scanMode === 'qr' ? 'qr' : 'code128');
  const [currentPostcode, setCurrentPostcode] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const textColor = useThemeColor({}, 'text');

  const barcodeScannerSettings = useMemo(
    () => (scanMode === 'qr' ? { barcodeTypes: ['qr'] as BarcodeType[] } : undefined),
    [scanMode]
  );

  const cameraZoom = 0;

  const resolvedStudentId = useMemo(() => {
    const candidate =
      (user as any)?.bsms_id ??
      (user as any)?.bsmsId ??
      (user as any)?.student_id ??
      (user as any)?.studentId ??
      user?.id;
    return candidate === undefined || candidate === null ? '' : String(candidate);
  }, [user]);

  const refreshCurrentLocation = useCallback(async () => {
    setLocationError(null);
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationError('Location services are disabled');
        setCurrentPostcode('');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission not granted');
        setCurrentPostcode('');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      const response = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = Array.isArray(response) ? response[0] : undefined;
      const postcode = (first as any)?.postalCode ? String((first as any).postalCode) : '';
      setCurrentPostcode(postcode);
    } catch (e: any) {
      setLocationError(e?.message ? String(e.message) : 'Could not read location');
      setCurrentPostcode('');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await db.execAsync(
        'create table if not exists scans (id integer primary key not null, barcode text not null, student_id text not null, synced integer not null default 0, created_at text not null);'
      );
      if (!mounted) return;
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    refreshCurrentLocation();
  }, [refreshCurrentLocation]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axiosConfig.get('/locations2025');
        setLocations(response.data);
      } catch (error) {
        console.error('Failed to fetch locations2025:', error);
      }
    };
    fetchLocations();
  }, []);

  const onBarcodeScanned = useCallback(
    (event: any) => {
      const result = event?.nativeEvent ?? event;
      const type = result?.type ? String(result?.type) : 'unknown';
      const data = result?.data ?? '';
      console.log('onBarcodeScanned', type, data);
      
      setDebugLog(prev => [
        `${new Date().toLocaleTimeString()}: ${type} - ${data.substring(0, 20)}`,
        ...prev.slice(0, 4)
      ]);
      
      if (scannedValue) return;
      setScannedType(type);
      setScannedValue(data);
    },
    [scannedValue]
  );

  const saveToLocalDb = useCallback(
    async (barcode: string, sid: string) => {
      try {
        const createdAt = new Date().toISOString();
        await db.runAsync(
          'insert into scans (barcode, student_id, synced, created_at) values (?,?,0,?);',
          [barcode, sid, createdAt]
        );
      } catch (e) {
        console.log('saveToLocalDb failed', e);
      }
    },
    []
  );

  const saveItem = useCallback(() => {
    const barcode = (scannedValue ?? '').trim();
    const sid = resolvedStudentId.trim();
    if (!barcode) return;
    if (!sid) return;

    // Save to local SQLite for offline tracking
    saveToLocalDb(barcode, sid);
  }, [resolvedStudentId, saveToLocalDb, scannedValue]);

  const onUseBarcode = useCallback(() => {
    const value = (scannedValue ?? '').trim();
    if (!value) return;

    saveItem();

    const returnTo = typeof params?.returnTo === 'string' ? params.returnTo : '';
    if (returnTo) {
      router.replace({
        pathname: returnTo,
        params: {
          locationBarcode: value,
          postcode: currentPostcode.trim() || undefined,
        },
      } as any);
      return;
    }

    router.back();
  }, [currentPostcode, params?.returnTo, router, saveItem, scannedValue]);

  if (!permission) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.title, { color: accentColor }]}>Barcode Sign In</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>Loading camera permission…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.title, { color: accentColor }]}>Barcode Sign In</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>Camera permission is required to scan.</Text>

          <TouchableOpacity
            onPress={() => requestPermission()}
            style={[styles.primaryButton, { backgroundColor: accentColor }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: buttonTextColor }]}>Allow Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={[styles.secondaryButton, { borderColor: accentColor }]} activeOpacity={0.85}>
            <Text style={[styles.secondaryButtonText, { color: accentColor }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.subtitleYellow, { color: accentColor }]}>Scan barcode</Text>

        <View style={styles.modeRow}>
          <Text style={[styles.modeLabel, { color: textColor }]}>CODE 128</Text>
          <Switch
            value={scanMode === 'qr'}
            onValueChange={v => {
              setScannedValue(null);
              setScannedType(null);
              setScanMode(v ? 'qr' : 'code128');
            }}
          />
          <Text style={[styles.modeLabel, { color: textColor }]}>QR</Text>
        </View>

        <View style={[styles.cameraFrame, { borderColor: accentColor }]}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            autofocus="off"
            zoom={cameraZoom}
            barcodeScannerSettings={barcodeScannerSettings}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View pointerEvents="none" style={styles.cameraOverlay}>
            <View style={[styles.scanBox, { borderColor: accentColor }]} />
          </View>
          
          {showDebug && (
            <View style={styles.debugOverlay}>
              <TouchableOpacity 
                onPress={() => setShowDebug(false)}
                style={styles.debugClose}
              >
                <Text style={styles.debugCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>Mode: {scanMode}</Text>
              <Text style={styles.debugText}>
                Filter: {barcodeScannerSettings ? JSON.stringify(barcodeScannerSettings.barcodeTypes) : 'ALL'}
              </Text>
              <Text style={styles.debugText}>Recent scans:</Text>
              {debugLog.map((log, i) => (
                <Text key={i} style={styles.debugLogText}>{log}</Text>
              ))}
              {debugLog.length === 0 && (
                <Text style={styles.debugLogText}>No scans detected yet</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <View style={styles.readonlyBox}>
            <TextInput style={styles.readonlyInput} value={scannedValue ?? ''} editable={false} />
          </View>

          <TouchableOpacity
            onPress={onUseBarcode}
            style={[styles.secondaryButton, { borderColor: accentColor }, !scannedValue && styles.saveButtonDisabled]}
            activeOpacity={0.85}
            disabled={!scannedValue}
          >
            <Text style={[styles.secondaryButtonText, { color: accentColor }]}>Use Barcode</Text>
          </TouchableOpacity>

          {!!scannedType && <Text style={[styles.detectedType, { color: textColor }]}>Detected type: {scannedType}</Text>}

          {!resolvedStudentId.trim() && (
            <Text style={[styles.inlineWarning, { color: textColor }]}>Login required before saving scans.</Text>
          )}

          {scannedValue ? (
            <TouchableOpacity
              onPress={() => setScannedValue(null)}
              style={[styles.secondaryButton, { borderColor: accentColor }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryButtonText, { color: accentColor }]}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.subtitle, { color: textColor }]}>Scanning…</Text>
          )}

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/')}
            style={[styles.secondaryButton, { borderColor: accentColor }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryButtonText, { color: accentColor }]}>Back to Home</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
  },
  subtitleYellow: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  cameraFrame: {
    marginTop: 16,
    width: '100%',
    maxWidth: 420,
    height: 340,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#003f54',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scanBox: {
    width: '92%',
    height: 160,
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  actions: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginTop: 16,
  },
  modeRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  readonlyBox: {
    width: '100%',
    backgroundColor: 'white',
    marginTop: 10,
  },
  readonlyInput: {
    height: 44,
    paddingHorizontal: 10,
    color: 'black',
    fontSize: 16,
  },
  detectedType: {
    width: '100%',
    marginTop: 8,
    fontSize: 13,
  },
  saveRow: {
    width: '100%',
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    borderWidth: 3,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 26,
    fontWeight: '700',
  },
  locationPill: {
    flex: 1,
    minHeight: 46,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  locationPillText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inlineWarning: {
    width: '100%',
    marginTop: 10,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  debugClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugCloseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugTitle: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  debugText: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 3,
  },
  debugLogText: {
    color: '#aaa',
    fontSize: 10,
    marginLeft: 8,
    marginTop: 2,
  },
});
