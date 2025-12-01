import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OnboardingData {
  businessName: string;
  businessLogo: string;
  location: string;
  description: string;
  websiteUrl: string;
  currency: string;
  industries: string[];
  businessNeeds: string[];
  timezone: string;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  eventTypeLabel: string;
  teamMemberLabel: string;
  customFields: CustomField[];
  isCompleted: boolean;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface OnboardingContextType {
  currentStep: number;
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

const STORAGE_KEY = 'zervos_onboarding';

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Initialize with fresh data (no pre-filled defaults)
  const [data, setData] = useState<OnboardingData>(() => {
    // Always start fresh - clear any old onboarding data
    localStorage.removeItem(STORAGE_KEY);
    
    return {
      businessName: '',
      businessLogo: '',
      location: '',
      description: '',
      websiteUrl: '',
      currency: 'INR',
      industries: [],
      businessNeeds: [],
      timezone: 'Asia/Kolkata - IST (+05:30)',
      availableDays: [],
      availableTimeStart: '09:00 am',
      availableTimeEnd: '06:00 pm',
      eventTypeLabel: '',
      teamMemberLabel: '',
      customFields: [],
      isCompleted: false,
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 4)));
  };

  return (
    <OnboardingContext.Provider
      value={{ currentStep, data, updateData, nextStep, prevStep, goToStep }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
