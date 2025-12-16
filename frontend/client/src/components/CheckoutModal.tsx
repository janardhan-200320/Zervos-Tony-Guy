import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CreditCard, Smartphone, Shield, Check, AlertCircle, 
  Lock, Building2, Calendar, Tag, ArrowLeft, Sparkles, Crown, Star 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    icon: React.ReactNode;
    color: string;
    features: string[];
  };
  billingCycle: 'monthly' | 'annual';
}

export default function CheckoutModal({ isOpen, onClose, plan, billingCycle }: CheckoutModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'success'>('review');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [formData, setFormData] = useState({
    // Card details
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    // UPI details
    upiId: '',
    // Billing details
    email: '',
    phone: '',
    gstNumber: '',
    companyName: '',
  });

  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const discount = billingCycle === 'annual' ? Math.round(((plan.monthlyPrice * 12) - plan.annualPrice) / (plan.monthlyPrice * 12) * 100) : 0;
  const gst = Math.round(price * 0.18);
  const total = price + gst;

  const handleProceedToPayment = () => {
    if (!formData.email || !formData.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your email and phone number',
        variant: 'destructive',
      });
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    // Validate payment details
    if (paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.cardName || !formData.expiry || !formData.cvv) {
        toast({
          title: 'Invalid Card Details',
          description: 'Please fill in all card information',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!formData.upiId) {
        toast({
          title: 'Invalid UPI ID',
          description: 'Please enter a valid UPI ID',
          variant: 'destructive',
        });
        return;
      }
    }

    setStep('processing');

    try {
      // Call backend API to process payment
      const response = await fetch('/api/subscriptions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
          paymentMethod,
          amount: total,
          email: formData.email,
          phone: formData.phone,
          gstNumber: formData.gstNumber,
          companyName: formData.companyName,
          paymentDetails: paymentMethod === 'card' 
            ? { last4: formData.cardNumber.slice(-4), cardName: formData.cardName }
            : { upiId: formData.upiId }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store subscription details in localStorage
        const currentWorkspace = localStorage.getItem('currentWorkspace') || 'default';
        const subscriptionData = {
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          amount: total,
          transactionId: data.transactionId,
        };
        localStorage.setItem(`zervos_subscription_${currentWorkspace}`, JSON.stringify(subscriptionData));

        setTimeout(() => {
          setStep('success');
          setTimeout(() => {
            window.location.reload(); // Reload to apply new features
          }, 2000);
        }, 2000);
      } else {
        throw new Error(data.message || 'Payment failed');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setStep('payment');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <AnimatePresence mode="wait">
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold">Review Your Order</DialogTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Plan Details */}
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl bg-gradient-to-br ${plan.color} text-white shadow-xl`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <p className="text-white/80 text-sm">Premium Features Included</p>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold">₹{price.toLocaleString()}</span>
                      <span className="text-white/80">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                    
                    {billingCycle === 'annual' && discount > 0 && (
                      <Badge className="bg-green-500 text-white border-0">
                        Save {discount}% with annual billing
                      </Badge>
                    )}
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      Included Features
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {plan.features.slice(0, 8).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 8 && (
                        <p className="text-xs text-gray-500 italic">
                          + {plan.features.length - 8} more features...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Billing Information */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold mb-4">Billing Information</h4>
                    <div className="space-y-4">
                      <div>
                        <Label>Email Address *</Label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Company Name (Optional)</Label>
                        <Input
                          placeholder="Your Company Name"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>GST Number (Optional)</Label>
                        <Input
                          placeholder="22AAAAA0000A1Z5"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                    <h4 className="font-semibold mb-4">Order Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subscription ({billingCycle})</span>
                        <span className="font-medium">₹{price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GST (18%)</span>
                        <span className="font-medium">₹{gst.toLocaleString()}</span>
                      </div>
                      {billingCycle === 'annual' && discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Annual Discount ({discount}%)</span>
                          <span className="font-medium">-₹{((plan.monthlyPrice * 12) - plan.annualPrice).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-indigo-200 pt-3 flex justify-between">
                        <span className="font-bold text-lg">Total Amount</span>
                        <span className="font-bold text-2xl text-indigo-600">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleProceedToPayment}
                    className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Proceed to Payment
                    <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setStep('review')}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <DialogTitle className="text-2xl font-bold">Payment Details</DialogTitle>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    Secure Payment
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Payment Method Selection */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="font-semibold mb-4">Select Payment Method</h4>
                    <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <div className="space-y-3">
                        <Label
                          htmlFor="card"
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <RadioGroupItem value="card" id="card" />
                          <CreditCard className="h-6 w-6 text-indigo-600" />
                          <div className="flex-1">
                            <p className="font-semibold">Credit / Debit Card</p>
                            <p className="text-xs text-gray-500">Visa, Mastercard, RuPay, Amex</p>
                          </div>
                          <Shield className="h-5 w-5 text-green-600" />
                        </Label>

                        <Label
                          htmlFor="upi"
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <RadioGroupItem value="upi" id="upi" />
                          <Smartphone className="h-6 w-6 text-purple-600" />
                          <div className="flex-1">
                            <p className="font-semibold">UPI Payment</p>
                            <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                          </div>
                          <Shield className="h-5 w-5 text-green-600" />
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Payment Form */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    {paymentMethod === 'card' ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold mb-4">Card Details</h4>
                        <div>
                          <Label>Card Number *</Label>
                          <Input
                            placeholder="1234 5678 9012 3456"
                            value={formData.cardNumber}
                            onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                            maxLength={19}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Cardholder Name *</Label>
                          <Input
                            placeholder="John Doe"
                            value={formData.cardName}
                            onChange={(e) => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Expiry Date *</Label>
                            <Input
                              placeholder="MM/YY"
                              value={formData.expiry}
                              onChange={(e) => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                              maxLength={5}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>CVV *</Label>
                            <Input
                              type="password"
                              placeholder="123"
                              value={formData.cvv}
                              onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                              maxLength={3}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h4 className="font-semibold mb-4">UPI Details</h4>
                        <div>
                          <Label>UPI ID *</Label>
                          <Input
                            placeholder="yourname@upi"
                            value={formData.upiId}
                            onChange={(e) => setFormData({ ...formData, upiId: e.target.value.toLowerCase() })}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter your UPI ID (e.g., 9876543210@paytm)</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-900">How it works:</p>
                              <ol className="text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                                <li>Enter your UPI ID</li>
                                <li>Click "Pay Now" to receive payment request</li>
                                <li>Approve the request in your UPI app</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handlePayment}
                    className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Pay ₹{total.toLocaleString()} Securely
                  </Button>
                </div>

                {/* Payment Summary */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 sticky top-4">
                    <h4 className="font-semibold mb-4">Payment Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan</span>
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Billing</span>
                        <span className="font-medium capitalize">{billingCycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium">₹{price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST</span>
                        <span className="font-medium">₹{gst.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-3 flex justify-between">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-xl text-indigo-600">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-xs">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">256-bit SSL Encrypted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-12 flex flex-col items-center justify-center min-h-[400px]"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-6"
              >
                <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Processing Payment...</h3>
              <p className="text-gray-600 text-center max-w-md">
                Please wait while we securely process your payment. Do not close this window.
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-12 flex flex-col items-center justify-center min-h-[400px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-white" />
                </div>
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Your {plan.name} subscription has been activated. You now have access to all premium features!
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="h-4 w-4" />
                <span>Redirecting to dashboard...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
