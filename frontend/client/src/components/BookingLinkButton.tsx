import { useState } from 'react';
import { Link2, Copy, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const BookingLinkButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();

  const bookingUrl = `${window.location.origin}/booking/${selectedWorkspace?.id || 'default'}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast({
      title: 'Link Copied!',
      description: 'Booking link copied to clipboard',
    });
  };

  const openBookingPage = () => {
    window.open(bookingUrl, '_blank');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book with ${selectedWorkspace?.name || 'us'}`,
          text: 'Book your appointment easily!',
          url: bookingUrl,
        });
      } catch (error) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openBookingPage}
        className="relative rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-2 text-white shadow-lg transition-all hover:shadow-xl"
      >
        <Link2 className="h-5 w-5" />
        
        {/* Badge */}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white"
        >
          <ExternalLink size={12} />
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
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-2">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Public Booking Link</h3>
                <p className="text-xs text-slate-600">Share with your customers</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600 mb-2">Your Booking URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white px-2 py-1 rounded border truncate">
                  {bookingUrl}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyLink}
                className="flex flex-col items-center gap-1 rounded-lg bg-blue-50 p-3 hover:bg-blue-100 transition-colors"
              >
                <Copy className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Copy</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openBookingPage}
                className="flex flex-col items-center gap-1 rounded-lg bg-green-50 p-3 hover:bg-green-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Open</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={shareLink}
                className="flex flex-col items-center gap-1 rounded-lg bg-purple-50 p-3 hover:bg-purple-100 transition-colors"
              >
                <Share2 className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Share</span>
              </motion.button>
            </div>

            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs">
              <p className="text-emerald-800 font-medium mb-1">✨ All-in-One Booking</p>
              <ul className="text-emerald-700 space-y-0.5">
                <li>• All services & products</li>
                <li>• Custom service requests</li>
                <li>• Real-time slot booking</li>
                <li>• Instant confirmations</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingLinkButton;
