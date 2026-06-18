import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  d: string;
  width: number;
};

export type SignaturePadRef = {
  clear: () => void;
  getBase64: () => string;
  isEmpty: () => boolean;
};

type Props = {
  height?: number;
  onSigningChange?: (isSigning: boolean) => void;
};

const SignaturePad = forwardRef<SignaturePadRef, Props>(
  ({ height = 130, onSigningChange }, ref) => {
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [activePath, setActivePath] = useState('');
    const points = useRef<Point[]>([]);
    const activePathRef = useRef('');

    const MIN_DISTANCE = 0.75;
    const STROKE_WIDTH = 2.4;

    const buildBase64 = useCallback((strokePaths: Stroke[], inProgressPath?: string) => {
      const allPaths =
        inProgressPath && inProgressPath.trim()
          ? [...strokePaths, { d: inProgressPath, width: STROKE_WIDTH }]
          : strokePaths;

      if (!allPaths.length) return '';

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
          ${allPaths
            .map((stroke) => `<path d="${stroke.d}" fill="none" stroke="#000" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`)
            .join('')}
        </svg>
      `;

      return btoa(unescape(encodeURIComponent(svg)));
    }, []);

    const appendPointToPath = useCallback((x: number, y: number) => {
      const prev = points.current[points.current.length - 1];
      if (!prev) return;

      const dist = Math.hypot(x - prev.x, y - prev.y);
      if (dist < MIN_DISTANCE) return;

      const nextPoint: Point = { x, y };
      points.current.push(nextPoint);

      const midX = (prev.x + nextPoint.x) / 2;
      const midY = (prev.y + nextPoint.y) / 2;

      if (points.current.length === 2) {
        activePathRef.current = `M ${prev.x} ${prev.y} Q ${prev.x} ${prev.y} ${midX} ${midY}`;
      } else {
        activePathRef.current += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
      }

      setActivePath(activePathRef.current);
    }, []);

    const finalizeStroke = useCallback(() => {
      onSigningChange?.(false);

      const currentPoints = points.current;
      let pathToSave = activePathRef.current;

      if (!pathToSave && currentPoints.length === 1) {
        const p = currentPoints[0];
        pathToSave = `M ${p.x} ${p.y} L ${p.x + 0.01} ${p.y + 0.01}`;
      }

      if (pathToSave) {
        setStrokes((prev) => [...prev, { d: pathToSave, width: STROKE_WIDTH }]);
      }

      points.current = [];
      activePathRef.current = '';
      setActivePath('');
    }, []);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onStartShouldSetPanResponderCapture: () => true,
          onMoveShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponderCapture: () => true,
          onShouldBlockNativeResponder: () => true,

          onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;

            onSigningChange?.(true);

            points.current = [
              {
                x: locationX,
                y: locationY,
              },
            ];
            activePathRef.current = `M ${locationX} ${locationY}`;
            setActivePath(activePathRef.current);
          },

          onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            appendPointToPath(locationX, locationY);
          },

          onPanResponderRelease: finalizeStroke,
          onPanResponderTerminate: finalizeStroke,
        }),
      [appendPointToPath, finalizeStroke]
    );

    useImperativeHandle(ref, () => ({
      clear: () => {
        onSigningChange?.(false);
        activePathRef.current = '';
        setActivePath('');
        setStrokes([]);
        points.current = [];
      },
      getBase64: () => buildBase64(strokes, activePathRef.current),
      isEmpty: () => strokes.length === 0 && !activePathRef.current,
    }), [buildBase64, strokes]);

    return (
      <View
        style={[styles.container, { height }]}
        {...panResponder.panHandlers}
      >
        <Svg height="100%" width="100%">
          {strokes.map((stroke, index) => (
            <Path
              key={index}
              d={stroke.d}
              fill="none"
              stroke="#000000"
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {!!activePath && (
            <Path
              d={activePath}
              fill="none"
              stroke="#000000"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>

        {strokes.length === 0 && !activePath && (
          <Text style={styles.placeholder}>Sign here</Text>
        )}
      </View>
    );
  }
);

export default SignaturePad;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#c7ced6',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    left: 14,
    top: 10,
    color: '#9aa3ab',
    fontSize: 18,
    opacity: 0.35,
  },
});