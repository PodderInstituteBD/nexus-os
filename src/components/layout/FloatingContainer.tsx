import React from 'react';
import { motion } from 'motion/react';

interface FloatingContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  floatDistance?: number;
  floatDuration?: number;
  hoverElevation?: boolean;
  withGlow?: boolean;
}

/**
 * FloatingContainer provides a gentle hover-and-float animation using Framer Motion,
 * reinforcing the NEXUS OS 3D spatial aesthetic across section headers and prominent cards.
 */
export const FloatingContainer: React.FC<FloatingContainerProps> = ({
  children,
  className = '',
  id,
  delay = 0,
  floatDistance = 4,
  floatDuration = 5.5,
  hoverElevation = true,
  withGlow = false,
}) => {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: [0, -floatDistance, 0],
        transition: {
          opacity: { duration: 0.35, delay: delay * 0.1 },
          y: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: floatDuration,
            ease: 'easeInOut',
            delay: delay,
          },
        },
      }}
      whileHover={
        hoverElevation
          ? {
              y: -(floatDistance + 3),
              scale: 1.004,
              rotateX: 0.5,
              transition: {
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1],
              },
            }
          : undefined
      }
      className={`relative preserve-3d transition-shadow ${
        hoverElevation ? 'hover:drop-shadow-md' : ''
      } ${className}`}
    >
      {withGlow && (
        <div
          aria-hidden="true"
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        />
      )}
      {children}
    </motion.div>
  );
};
