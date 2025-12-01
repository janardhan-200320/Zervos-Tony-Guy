import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface ProgressStepperProps {
  currentStep: number;
  steps: Step[];
}

export default function ProgressStepper({ currentStep, steps }: ProgressStepperProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isUpcoming = currentStep < step.number;

        return (
          <div key={step.number}>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
                    ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                    ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                    ${isUpcoming ? 'bg-muted text-muted-foreground border-2 border-border' : ''}
                  `}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 mt-2 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="text-xs text-muted-foreground mb-1">Step {step.number}</div>
                <h3
                  className={`font-semibold ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                  data-testid={`step-title-${step.number}`}
                >
                  {step.title}
                </h3>
                {isCurrent && (
                  <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
