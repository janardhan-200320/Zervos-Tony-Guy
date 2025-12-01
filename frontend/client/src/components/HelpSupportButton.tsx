import { useState } from 'react';
import { HelpCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

const HelpSupportButton = () => {
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setLocation('/dashboard/help-support')}
        className="relative rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2 text-white shadow-lg transition-all hover:shadow-xl"
      >
        <HelpCircle className="h-5 w-5" />
        
        {/* Pulse indicator */}
        <motion.span
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-1 -top-1 flex h-3 w-3"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-pink-500"></span>
        </motion.span>
      </motion.button>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Help & Support</h3>
                <p className="text-xs text-slate-600">We're here for you</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2">
                <span className="text-sm text-slate-700">Response Time</span>
                <span className="font-semibold text-purple-600">&lt; 5 min</span>
              </div>
              
              <div className="flex items-center justify-between rounded-lg bg-pink-50 p-2">
                <span className="text-sm text-slate-700">Agents Online</span>
                <span className="font-semibold text-pink-600">12</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2">
                <span className="text-sm text-slate-700">Satisfaction</span>
                <span className="font-semibold text-emerald-600">4.9/5 ⭐</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation('/dashboard/help-support')}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              Get Help Now
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HelpSupportButton;
