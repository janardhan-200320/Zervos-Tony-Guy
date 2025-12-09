import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import ProgressStepper from '@/components/ProgressStepper';
import Step1BusinessDetails from '@/components/Step1BusinessDetails';
import Step3Availability from '@/components/Step3Availability';
import { motion } from 'framer-motion';

const steps = [
  {
    number: 1,
    title: 'Business details',
    description: "Tell us about your business, and we'll work our magic.",
  },
  {
    number: 2,
    title: 'Set up your availability',
    description: 'Share your availability and start getting booked.',
  },
];

// Animated background component with 3D geometric shapes
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-gray-900/5 to-gray-600/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          x: [0, 50, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-gray-800/5 to-gray-500/5 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating geometric shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${10 + (i * 15)}%`,
            top: `${20 + (i * 10)}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, 360],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        >
          {i % 3 === 0 ? (
            <div className="w-16 h-16 border-2 border-gray-900/10 rounded-lg rotate-45" />
          ) : i % 3 === 1 ? (
            <div className="w-12 h-12 border-2 border-gray-800/10 rounded-full" />
          ) : (
            <div className="w-14 h-14 border-2 border-gray-700/10 transform rotate-45">
              <div className="w-full h-full border-2 border-gray-600/10 rotate-45" />
            </div>
          )}
        </motion.div>
      ))}

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

function OnboardingContent() {
  const { currentStep } = useOnboarding();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BusinessDetails />;
      case 2:
        return <Step3Availability />;
      default:
        return <Step1BusinessDetails />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative flex flex-col overflow-hidden">
      <AnimatedBackground />
      
      {/* Header with glassmorphism effect */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b-2 border-gray-200/50 shadow-sm z-10 flex-shrink-0">
        <div className="px-8 py-5">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white relative z-10" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </motion.div>
            <div>
              <span className="font-bold text-2xl text-gray-900 tracking-tight">Bookings</span>
              <div className="text-xs text-gray-500 font-medium">Professional Setup</div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* Left Section - Form */}
        <motion.div 
          className="w-1/2 flex items-center justify-center px-8 py-6 overflow-hidden"
          key={currentStep}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-gray-200/50 relative overflow-y-auto w-full h-full max-h-full">
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-800/5 to-transparent rounded-tr-full" />
            
            <div className="relative z-10">
              {renderStep()}
            </div>
          </div>
        </motion.div>

        {/* Right Section - Progress */}
        <motion.div 
          className="w-1/2 flex flex-col gap-5 px-8 py-6 overflow-hidden"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex-1 flex flex-col gap-5 overflow-hidden justify-start">
            <ProgressStepper currentStep={currentStep} steps={steps} />
          </div>
        </motion.div>
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
