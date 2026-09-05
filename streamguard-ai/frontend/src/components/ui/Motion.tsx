import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

export const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.48,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const MotionDiv: React.FC<HTMLMotionProps<'div'>> = ({ children, ...props }) => {
  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MotionSection: React.FC<HTMLMotionProps<'section'>> = ({ children, ...props }) => {
  return (
    <motion.section
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      {...props}
    >
      {children}
    </motion.section>
  );
};
