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
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                  <span className="text-[10px] text-primary-foreground font-bold">✓</span>
                </div>
                <div className="font-semibold text-sm">
                  {data.industries[0] || 'HR'}
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
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="text-xs font-medium">
                {data.availableTimeStart || '09:00 am'}
              </div>
              <div className="text-xs font-medium">
                {data.availableTimeEnd || '06:00 pm'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-medium text-muted-foreground">
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
              </div>

              {[0, 1, 2, 3, 4].map((week) => (
                <div key={week} className="grid grid-cols-7 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const dayIndex = week * 7 + day;
                    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
                    const isAvailable = data.availableDays.includes(dayName);
                    const isEmpty = dayIndex < 5 || dayIndex > 34;

                    return (
                      <div
                        key={day}
                        className={`
                          aspect-square rounded flex items-center justify-center text-xs
                          ${isEmpty ? '' : isAvailable ? 'bg-primary/20 text-primary font-medium' : 'bg-muted/20'}
                        `}
                      >
                        {!isEmpty && dayIndex - 4}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-foreground" />
                <div className="font-medium text-sm">
                  {data.eventTypeLabel || 'Properties Management'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-foreground" />
                <div className="font-medium text-sm">
                  {data.teamMemberLabel || 'Agents'}
                </div>
              </div>
            </div>
          </div>
        );

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
