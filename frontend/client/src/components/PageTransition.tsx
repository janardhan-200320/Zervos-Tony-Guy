import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  pathname?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1], // Custom easeOut curve
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

export default function PageTransition({ children, pathname }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
