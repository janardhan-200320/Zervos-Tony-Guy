import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import ProgressStepper from '@/components/ProgressStepper';
import Step1BusinessDetails from '@/components/Step1BusinessDetails';
import Step3Availability from '@/components/Step3Availability';
import Step4CustomLabels from '@/components/Step4CustomLabels';
import SidebarPreview from '@/components/SidebarPreview';

const steps = [
  {
    number: 1,
    title: 'Business details',
    description: "Tell us about your business, and we'll work our magic.",
  },
  {
    number: 2,
    title: 'Industry details',
    description: "Based on your industry, our AI will set up your dashboard to align with your business.",
  },
  {
    number: 3,
    title: 'Set up your availability',
    description: 'Share your availability and start getting booked.',
  },
  {
    number: 4,
    title: 'Update your custom labels',
    description: 'Rename certain modules in the product to match with your business terminologies.',
  },
];

function OnboardingContent() {
  const { currentStep } = useOnboarding();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BusinessDetails />;
      case 2:
        return <Step3Availability />;
      case 3:
        return <Step4CustomLabels />;
      case 4:
        return <Step1BusinessDetails />;
      default:
        return <Step1BusinessDetails />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Bookings</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-[1fr,380px] gap-12">
          <div className="max-w-2xl">
            {renderStep()}
          </div>

          <div className="space-y-6">
            <ProgressStepper currentStep={currentStep} steps={steps} />
            <SidebarPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
