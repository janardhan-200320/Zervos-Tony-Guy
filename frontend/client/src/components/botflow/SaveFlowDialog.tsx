import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Sparkles,
  Target,
  MessageSquare,
  Clock,
  Hash,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SaveFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description: string;
    triggerType: string;
    triggerValue: string;
  }) => Promise<void>;
  isSaving: boolean;
  existingFlow?: {
    name: string;
    description: string;
    triggerType: string;
    triggerValue: string;
  };
}

const triggerTypes = [
  {
    id: 'keyword',
    name: 'Keyword Trigger',
    icon: Hash,
    description: 'Start when user sends specific keywords',
    placeholder: 'e.g., start, hello, help',
    example: 'Triggers on: "hello", "hi", "start"',
  },
  {
    id: 'welcome',
    name: 'Welcome Message',
    icon: Sparkles,
    description: 'Send when user first contacts',
    placeholder: 'welcome',
    example: 'Sent to first-time contacts',
  },
  {
    id: 'scheduled',
    name: 'Scheduled',
    icon: Clock,
    description: 'Send at specific times',
    placeholder: 'Daily at 9:00 AM',
    example: 'Recurring time-based trigger',
  },
  {
    id: 'event',
    name: 'Event-Based',
    icon: Target,
    description: 'Trigger on specific events',
    placeholder: 'e.g., booking_confirmed',
    example: 'Triggers on system events',
  },
];

export const SaveFlowDialog: React.FC<SaveFlowDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  isSaving,
  existingFlow,
}) => {
  const [name, setName] = useState(existingFlow?.name || '');
  const [description, setDescription] = useState(existingFlow?.description || '');
  const [selectedTrigger, setSelectedTrigger] = useState(existingFlow?.triggerType || 'keyword');
  const [triggerValue, setTriggerValue] = useState(existingFlow?.triggerValue || '');
  const [step, setStep] = useState<'details' | 'trigger'>('details');
  const [errors, setErrors] = useState<{ name?: string; triggerValue?: string }>({});

  const handleNext = () => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Flow name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setStep('trigger');
  };

  const handleBack = () => {
    setStep('details');
  };

  const handleSave = async () => {
    const newErrors: { triggerValue?: string } = {};
    
    if (!triggerValue.trim()) {
      newErrors.triggerValue = 'Trigger value is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    await onSave({
      name: name.trim(),
      description: description.trim(),
      triggerType: selectedTrigger,
      triggerValue: triggerValue.trim(),
    });
  };

  const selectedTriggerType = triggerTypes.find((t) => t.id === selectedTrigger);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Save className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {existingFlow ? 'Update Flow' : 'Save Your Flow'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {step === 'details'
                  ? 'Give your flow a name and description'
                  : 'Configure how this flow gets triggered'}
              </DialogDescription>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <motion.div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                step === 'details'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700'
              }`}
              animate={{ scale: step === 'details' ? 1 : 0.95 }}
            >
              {step === 'trigger' && <CheckCircle2 className="h-4 w-4" />}
              <span>1. Details</span>
            </motion.div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-600"
                initial={{ width: '0%' }}
                animate={{ width: step === 'trigger' ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <motion.div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                step === 'trigger'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
              animate={{ scale: step === 'trigger' ? 1 : 0.95 }}
            >
              <span>2. Trigger</span>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {step === 'details' ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    Flow Name
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Welcome Greeting Flow, Product Inquiry Bot"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`h-11 ${errors.name ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what this flow does and when it should be used..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add details to help you remember what this flow is for
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 text-sm mb-1">
                        Pro Tip
                      </h4>
                      <p className="text-blue-800 text-xs leading-relaxed">
                        Use clear, descriptive names for your flows. This helps when managing
                        multiple automation flows and makes it easier to track performance.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="trigger"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-3 block">
                    Select Trigger Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {triggerTypes.map((trigger) => {
                      const Icon = trigger.icon;
                      const isSelected = selectedTrigger === trigger.id;
                      return (
                        <motion.button
                          key={trigger.id}
                          onClick={() => setSelectedTrigger(trigger.id)}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-semibold text-sm mb-1 ${
                                  isSelected ? 'text-purple-900' : 'text-gray-900'
                                }`}
                              >
                                {trigger.name}
                              </h4>
                              <p className="text-xs text-gray-600 leading-snug">
                                {trigger.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2"
                            >
                              <CheckCircle2 className="h-5 w-5 text-purple-600" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {selectedTriggerType && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Trigger Value
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder={selectedTriggerType.placeholder}
                      value={triggerValue}
                      onChange={(e) => {
                        setTriggerValue(e.target.value);
                        if (errors.triggerValue)
                          setErrors({ ...errors, triggerValue: undefined });
                      }}
                      className={`h-11 ${errors.triggerValue ? 'border-red-500' : ''}`}
                    />
                    {errors.triggerValue && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.triggerValue}
                      </motion.p>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Example:</span>{' '}
                        {selectedTriggerType.example}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex gap-2">
            {step === 'trigger' && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
                className="gap-2"
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            {step === 'details' ? (
              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                Next
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Save className="h-4 w-4" />
                    </motion.div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {existingFlow ? 'Update Flow' : 'Create Flow'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
