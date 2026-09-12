import React from 'react';
import { motion, useTransform } from 'motion/react';
import { useSpatial } from '../../context/SpatialContext';

/**
 * AmbientSpatialBackground renders a subtle, slow-moving 3D ambient floating layer
 * behind the main views, subscribed to SpatialContext to produce unified 3D parallax
 * and perspective across the entire NEXUS OS canvas.
 */
export const AmbientSpatialBackground: React.FC = () => {
  const { smoothX, smoothY, tiltX, tiltY } = useSpatial();

  // Subtle global parallax offsets for background depth layers
  const meshX = useTransform(smoothX, [-1, 1], [-16, 16]);
  const meshY = useTransform(smoothY, [-1, 1], [-12, 12]);

  const orb1X = useTransform(smoothX, [-1, 1], [-30, 30]);
  const orb1Y = useTransform(smoothY, [-1, 1], [-25, 25]);

  const orb2X = useTransform(smoothX, [-1, 1], [35, -35]);
  const orb2Y = useTransform(smoothY, [-1, 1], [30, -30]);

  const particleX = useTransform(smoothX, [-1, 1], [-45, 45]);
  const particleY = useTransform(smoothY, [-1, 1], [-35, 35]);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        rotateX: tiltX,
        rotateY: tiltY,
        transformStyle: 'preserve-3d',
      }}
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10 perspective-1000 preserve-3d select-none"
    >
      {/* Subtle Perspective Grid Mesh subscribed to global coordinates */}
      <motion.div
        style={{ x: meshX, y: meshY }}
        className="absolute inset-0 ambient-grid-bg opacity-30 ambient-drift-mesh"
      />

      {/* Floating Ambient Lighting Orb 1: Upper Right (Deep Blue / Indigo) */}
      <motion.div
        style={{ x: orb1X, y: orb1Y }}
        className="absolute -top-24 right-1/4 w-[520px] h-[520px] rounded-full blur-3xl ambient-float-slow ambient-pulse-glow"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Floating Ambient Lighting Orb 2: Lower Left (Violet / Slate) */}
      <motion.div
        style={{ x: orb2X, y: orb2Y }}
        className="absolute -bottom-32 -left-20 w-[600px] h-[600px] rounded-full blur-3xl ambient-float-reverse"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 60%, transparent 80%)',
          }}
        />
      </motion.div>

      {/* Floating Ambient Lighting Orb 3: Center Ambient Depth */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl ambient-float-gentle opacity-40"
        style={{
          background: 'radial-gradient(ellipse, rgba(14, 165, 233, 0.04) 0%, transparent 75%)',
        }}
      />

      {/* 3D Depth Floating Foreground Particles */}
      <motion.div
        style={{ x: particleX, y: particleY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-20 left-12 w-2 h-2 rounded-full bg-blue-400/25 ambient-float-slow" />
        <div className="absolute top-1/2 right-16 w-3 h-3 rounded-full bg-purple-400/25 ambient-float-reverse" />
        <div className="absolute bottom-24 left-1/3 w-2.5 h-2.5 rounded-full bg-indigo-400/20 ambient-float-gentle" />
      </motion.div>
    </motion.div>
  );
};

