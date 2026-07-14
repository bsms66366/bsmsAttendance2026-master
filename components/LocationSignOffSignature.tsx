import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SignaturePad, { SignaturePadRef } from './SignaturePad';

export type LocationSignOffSignatureRef = {
  clear: () => void;
  getBase64: () => string;
  isEmpty: () => boolean;
};

type Props = {
  onSigningChange?: (isSigning: boolean) => void;
  labelColor?: string;
  textColor?: string;
};

export const LocationSignOffSignature = forwardRef<LocationSignOffSignatureRef, Props>(
  ({ onSigningChange, labelColor = '#59636d', textColor = '#ffffff' }, ref) => {
    const padRef = useRef<SignaturePadRef>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const handleSigningChange = useCallback(
      (signing: boolean) => {
        onSigningChange?.(signing);
        if (!signing) {
          setIsEmpty(padRef.current?.isEmpty() ?? true);
        }
      },
      [onSigningChange]
    );

    const clear = useCallback(() => {
      padRef.current?.clear();
      setIsEmpty(true);
    }, []);

    useImperativeHandle(ref, () => ({
      clear,
      getBase64: () => padRef.current?.getBase64() ?? '',
      isEmpty: () => padRef.current?.isEmpty() ?? true,
    }));

    return (
      <View>
        <View style={[styles.labelRow, styles.mt]}>
          <Text style={[styles.label, { color: labelColor }]}>Signature box</Text>
          <TouchableOpacity
            style={styles.signatureIconButton}
            onPress={clear}
            accessibilityRole="button"
            accessibilityLabel="Clear signature"
            hitSlop={8}
          >
            <MaterialIcons name="delete-outline" size={22} color={textColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.signatureBox}>
          <SignaturePad ref={padRef} onSigningChange={handleSigningChange} />
          {isEmpty && <Text style={styles.signaturePlaceholder}>Press down to add signature</Text>}
        </View>
      </View>
    );
  }
);

LocationSignOffSignature.displayName = 'LocationSignOffSignature';

const styles = StyleSheet.create({
  label: {
    color: '#59636d',
    fontSize: 16,
    marginBottom: 8,
  },
  mt: {
    marginTop: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#c7ced6',
    backgroundColor: '#ffffff',
    height: 130,
    borderRadius: 2,
    position: 'relative',
  },
  signaturePlaceholder: {
    position: 'absolute',
    left: 14,
    top: 10,
    color: '#9aa3ab',
    fontSize: 18,
    opacity: 0.35,
  },
  signatureIconButton: {
    backgroundColor: '#2f6e90',
    height: 34,
    width: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
