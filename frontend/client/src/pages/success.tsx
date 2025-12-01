import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Success() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Onboarding complete! In a real app, this would redirect to the dashboard.');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Account Created Successfully!
          </h1>
          <p className="text-muted-foreground">
            Your business profile has been set up and you're ready to start accepting bookings.
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => setLocation('/')}
            className="min-w-48"
            data-testid="button-go-to-dashboard"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
