import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Heart, DollarSign, Star, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billAmount: number;
  staffMember: string;
  staffId: string;
  transactionId: string;
  customerName?: string;
  branchId: string;
}

const SUGGESTED_TIP_PERCENTAGES = [10, 15, 20, 25];

export default function TipDialog({
  isOpen,
  onClose,
  billAmount,
  staffMember,
  staffId,
  transactionId,
  customerName,
  branchId,
}: TipDialogProps) {
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const calculateTipAmount = () => {
    if (customAmount) {
      return parseFloat(customAmount) || 0;
    }
    if (selectedPercentage) {
      return (billAmount * selectedPercentage) / 100;
    }
    return 0;
  };

  const tipAmount = calculateTipAmount();

  const handleTipSubmit = () => {
    if (tipAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please select or enter a tip amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Save tip to localStorage
    const tipData = {
      id: `tip_${Date.now()}`,
      transactionId,
      staffId,
      staffMember,
      amount: tipAmount,
      billAmount,
      customerName: customerName || 'Walk-in Customer',
      timestamp: new Date().toISOString(),
      branchId,
    };

    // Get existing tips
    const existingTips = JSON.parse(localStorage.getItem(`tips_${branchId}`) || '[]');
    existingTips.push(tipData);
    localStorage.setItem(`tips_${branchId}`, JSON.stringify(existingTips));

    // Update staff tips summary
    const staffTipsSummary = JSON.parse(localStorage.getItem(`staff_tips_summary_${branchId}`) || '{}');
    if (!staffTipsSummary[staffId]) {
      staffTipsSummary[staffId] = {
        staffName: staffMember,
        totalTips: 0,
        tipCount: 0,
      };
    }
    staffTipsSummary[staffId].totalTips += tipAmount;
    staffTipsSummary[staffId].tipCount += 1;
    localStorage.setItem(`staff_tips_summary_${branchId}`, JSON.stringify(staffTipsSummary));

    setTimeout(() => {
      toast({
        title: '💖 Thank You!',
        description: `₹${tipAmount.toFixed(2)} tip added for ${staffMember}`,
      });
      setIsSubmitting(false);
      handleClose();
    }, 500);
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    setSelectedPercentage(null);
    setCustomAmount('');
    onClose();
  };

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPercentage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500"
              >
                <Heart className="h-6 w-6 text-white fill-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl">Show Your Appreciation</DialogTitle>
                <DialogDescription className="text-sm">
                  Leave a tip for {staffMember}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bill Summary */}
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bill Amount</span>
              <span className="text-lg font-bold text-gray-900">₹{billAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Suggested Percentages */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Quick Tip Suggestions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SUGGESTED_TIP_PERCENTAGES.map((percentage) => {
                const amount = (billAmount * percentage) / 100;
                const isSelected = selectedPercentage === percentage;
                return (
                  <motion.button
                    key={percentage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePercentageClick(percentage)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-100 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <span className={`text-lg font-bold ${isSelected ? 'text-purple-600' : 'text-gray-900'}`}>
                      {percentage}%
                    </span>
                    <span className="text-xs text-gray-500">₹{amount.toFixed(0)}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ₹
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="pl-8 text-lg"
                min="0"
                step="10"
              />
            </div>
          </div>

          {/* Total Preview */}
          {tipAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-2 border-green-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">Tip Amount</span>
                </div>
                <span className="text-2xl font-bold text-green-600">₹{tipAmount.toFixed(2)}</span>
              </div>
            </motion.div>
          )}

          {/* Appreciation Message */}
          <div className="text-center">
            <p className="text-xs text-gray-500 italic">
              "Your generosity makes a difference! 💝"
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleSkip} disabled={isSubmitting} className="flex-1">
            <X className="mr-2 h-4 w-4" />
            Skip
          </Button>
          <Button
            onClick={handleTipSubmit}
            disabled={isSubmitting || tipAmount <= 0}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Heart className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Processing...' : 'Confirm Tip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
