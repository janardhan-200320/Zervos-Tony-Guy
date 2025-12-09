import { useOnboarding } from '@/contexts/OnboardingContext';
import { Calendar, Building2, Users, FileText } from 'lucide-react';

export default function SidebarPreview() {
  const { currentStep, data } = useOnboarding();

  const getPreviewContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="h-3 bg-muted rounded w-32" />
                <div className="h-2 bg-muted/60 rounded w-24" />
              </div>
            </div>

            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border-2 border-muted flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-muted" />
                </div>
                <div className="h-2 bg-muted/40 rounded flex-1" />
              </div>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="font-semibold text-sm">
                  Availability Preview
                </div>
              </div>

              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 border-muted" />
                  <div className="h-2 bg-muted/40 rounded w-24" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted/20 rounded-lg" />
              ))}
            </div>
          </div>
        );

      case 3:
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="bg-muted/20 rounded-lg p-6">
      {getPreviewContent()}
    </div>
  );
}
