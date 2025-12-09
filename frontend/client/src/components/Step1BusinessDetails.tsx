import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Upload, X, Building2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export default function Step1BusinessDetails() {
  const { data, updateData, nextStep } = useOnboarding();
  const [businessName, setBusinessName] = useState(data.businessName);
  const [businessLogo, setBusinessLogo] = useState(data.businessLogo);
  const [location, setLocation] = useState(data.location);
  const [description, setDescription] = useState(data.description);
  const [websiteUrl, setWebsiteUrl] = useState(data.websiteUrl);
  const [currency, setCurrency] = useState(data.currency);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.match(/^https?:\/\/.+\..+/) !== null;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setBusinessLogo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormValid = businessName.trim() !== '' && isValidUrl(websiteUrl) && currency !== '';

  const handleNext = () => {
    updateData({ 
      businessName, 
      businessLogo, 
      location, 
      description, 
      websiteUrl, 
      currency,
      // Set default industry and business needs since they're required
      industries: ['General'],
      businessNeeds: ['Booking Management'],
    });
    
    // Save business details to localStorage immediately for persistence
    try {
      // Update organization profile
      const existingOrg = localStorage.getItem('zervos_organization');
      const orgProfile = existingOrg ? JSON.parse(existingOrg) : {};
      const updatedOrg = {
        ...orgProfile,
        businessName: businessName.trim(),
        name: businessName.trim(),
        logo: businessLogo || '',
        tagline: description || '',
        description: description || '',
        website: websiteUrl || '',
        address: location || '',
        location: location || '',
        currency: currency || 'INR',
      };
      localStorage.setItem('zervos_organization', JSON.stringify(updatedOrg));
      
      // Update company profile
      const existingCompany = localStorage.getItem('zervos_company');
      const companyProfile = existingCompany ? JSON.parse(existingCompany) : {};
      const updatedCompany = {
        ...companyProfile,
        name: businessName.trim(),
        businessName: businessName.trim(),
        logo: businessLogo || '',
        location: location || '',
        description: description || '',
        website: websiteUrl || '',
        currency: currency || 'INR',
      };
      localStorage.setItem('zervos_company', JSON.stringify(updatedCompany));
      
      // Update booking page settings
      const existingBooking = localStorage.getItem('zervos_booking_page');
      const bookingSettings = existingBooking ? JSON.parse(existingBooking) : {};
      const updatedBooking = {
        ...bookingSettings,
        businessName: businessName.trim(),
        logo: businessLogo || '',
        tagline: description || '',
        welcomeMessage: `Welcome to ${businessName.trim()}! Book your appointment with us.`,
        website: websiteUrl || '',
        address: location || '',
      };
      localStorage.setItem('zervos_booking_page', JSON.stringify(updatedBooking));
    } catch (e) {
      console.error('Error saving business details to localStorage:', e);
    }
    
    nextStep();
  };

  // Get user name from localStorage
  const currentUser = JSON.parse(localStorage.getItem('zervos_current_user') || '{}');
  const userName = currentUser.name || 'User';

  return (
    <div className="space-y-8">
      <motion.div 
        className="space-y-3 relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated sparkles */}
        <motion.div
          className="absolute -top-4 -right-4"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-8 h-8 text-gray-400" />
        </motion.div>
        
        <motion.h2 
          className="text-base text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Welcome to Zervos Bookings, <span className="font-bold text-gray-900">{userName}</span>!
        </motion.h2>
        
        <motion.h1 
          className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 tracking-tight leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Let's get you meeting ready!
        </motion.h1>
        
        <motion.div 
          className="h-1 w-24 bg-gradient-to-r from-gray-900 to-gray-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </motion.div>

      {/* Form Cards Container */}
      <motion.div 
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Business Name Card */}
        <motion.div 
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="businessName" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  Business name <span className="text-red-600">*</span>
                </Label>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-gray-900 rounded-full"
                />
              </div>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                data-testid="input-business-name"
                className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 rounded-xl text-base font-medium placeholder:text-gray-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Business Logo Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-600" />
                Business Logo
              </Label>
              <div className="flex items-center gap-5">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {businessLogo ? (
                    <div className="relative w-28 h-28 border-3 border-gray-300 rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                      <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                      <motion.button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={16} />
                      </motion.button>
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 border-3 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Building2 size={40} className="text-gray-400" />
                    </div>
                  )}
                </motion.div>
                <div className="flex-1 space-y-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-12 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-900 hover:text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      <Upload size={18} className="mr-2" />
                      {businessLogo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </motion.div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Location Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <Label htmlFor="location" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Business Location
              </Label>
              <Input
                id="location"
                placeholder="City, State, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 rounded-xl text-base font-medium placeholder:text-gray-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Description Card */}
        <motion.div
          className="group relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <Label htmlFor="description" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Business Description
              </Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your business..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 rounded-xl text-base font-medium placeholder:text-gray-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Website & Currency Row */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Website Card */}
          <motion.div
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <Label htmlFor="website" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </Label>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center justify-center px-3 bg-gray-900 text-white rounded-xl text-xs font-bold h-14 whitespace-nowrap">
                    https://
                  </div>
                  <Input
                    id="website"
                    placeholder="sample.com"
                    value={websiteUrl.replace(/^https?:\/\//, '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setWebsiteUrl(value.startsWith('http') ? value : `https://${value}`);
                    }}
                    data-testid="input-website-url"
                    className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-200 rounded-xl text-base font-medium placeholder:text-gray-400 flex-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Currency Card */}
          <motion.div
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-2xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <Label htmlFor="currency" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Currency {data.currency && `(${data.currency})`}
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" data-testid="select-currency" className="h-14 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-900 rounded-xl text-base font-medium">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="flex justify-end pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleNext}
            disabled={!isFormValid}
            data-testid="button-next"
            className="min-w-36 h-12 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10">Next</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
