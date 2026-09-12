import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  SpringOptions
} from 'motion/react';

export interface SpatialCoordinates {
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (top) to 1 (bottom)
}

export interface SpatialContextType {
  // Raw normalized motion values (-1 to 1, (0, 0) is window center)
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;

  // Physics-smoothed motion values
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;

  // Global shared 3D perspective pitch and yaw transforms
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;

  // Normalized coordinate state for non-motion consumers
  coords: SpatialCoordinates;

  // Active tracking flag
  isPointerActive: boolean;
}

const defaultSpringOptions: SpringOptions = {
  stiffness: 140,
  damping: 24,
  mass: 0.2,
};

const SpatialContext = createContext<SpatialContextType | null>(null);

export interface SpatialProviderProps {
  children: React.ReactNode;
  springOptions?: SpringOptions;
}

export const SpatialProvider: React.FC<SpatialProviderProps> = ({
  children,
  springOptions = defaultSpringOptions,
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, springOptions);
  const smoothY = useSpring(mouseY, springOptions);

  // Global subtle pitch (X-axis tilt based on Y position) and yaw (Y-axis tilt based on X position)
  const tiltX = useTransform(smoothY, [-1, 1], [6, -6]);
  const tiltY = useTransform(smoothX, [-1, 1], [-8, 8]);

  const [coords, setCoords] = useState<SpatialCoordinates>({ x: 0, y: 0 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;

      // Normalized coordinates from -1 to 1 where 0 is center
      const normX = Math.max(-1, Math.min(1, (e.clientX / width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (e.clientY / height) * 2 - 1));

      mouseX.set(normX);
      mouseY.set(normY);

      if (!isPointerActive) {
        setIsPointerActive(true);
      }

      // Schedule lightweight state sync for non-Framer consumers
      if (frameId === null) {
        frameId = requestAnimationFrame(() => {
          setCoords({ x: normX, y: normY });
          frameId = null;
        });
      }
    };

    const handleMouseLeave = () => {
      // Fluidly return to neutral center plane
      mouseX.set(0);
      mouseY.set(0);
      setCoords({ x: 0, y: 0 });
      setIsPointerActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [mouseX, mouseY, isPointerActive]);

  const contextValue = useMemo<SpatialContextType>(
    () => ({
      mouseX,
      mouseY,
      smoothX,
      smoothY,
      tiltX,
      tiltY,
      coords,
      isPointerActive,
    }),
    [mouseX, mouseY, smoothX, smoothY, tiltX, tiltY, coords, isPointerActive]
  );

  return (
    <SpatialContext.Provider value={contextValue}>
      {children}
    </SpatialContext.Provider>
  );
};

/**
 * Access the shared global spatial context
 */
export const useSpatial = (): SpatialContextType => {
  const context = useContext(SpatialContext);
  if (!context) {
    throw new Error('useSpatial must be used within a SpatialProvider');
  }
  return context;
};

export interface SpatialTransformConfig {
  shiftX?: number; // max translation X in px
  shiftY?: number; // max translation Y in px
  rotateX?: number; // max tilt degrees
  rotateY?: number; // max yaw degrees
  scale?: number; // max scale change
  depthOffset?: number; // translateZ offset
  invert?: boolean;
}

/**
 * Convenience hook for any component to subscribe to shared 3D perspective transforms
 */
export const useSpatialTransform = ({
  shiftX = 10,
  shiftY = 8,
  rotateX = 4,
  rotateY = 5,
  depthOffset = 0,
  invert = false,
}: SpatialTransformConfig = {}) => {
  const { smoothX, smoothY } = useSpatial();

  const factor = invert ? -1 : 1;

  const x = useTransform(smoothX, [-1, 1], [-shiftX * factor, shiftX * factor]);
  const y = useTransform(smoothY, [-1, 1], [-shiftY * factor, shiftY * factor]);
  const rX = useTransform(smoothY, [-1, 1], [rotateX * factor, -rotateX * factor]);
  const rY = useTransform(smoothX, [-1, 1], [-rotateY * factor, rotateY * factor]);
  const z = useTransform(smoothY, [-1, 0, 1], [depthOffset * 0.5, depthOffset, depthOffset * 0.5]);

  return { x, y, rotateX: rX, rotateY: rY, z };
};
