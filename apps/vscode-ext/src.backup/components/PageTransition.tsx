import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
    keyProp: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, keyProp }) => (
    <AnimatePresence mode="wait">
        <motion.div
            key={keyProp}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{ height: '100%' }}
        >
            {children}
        </motion.div>
    </AnimatePresence>
);
