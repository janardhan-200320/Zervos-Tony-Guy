import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BranchLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchName: string;
  branchCode: string;
}

export default function BranchLoginDialog({
  isOpen,
  onClose,
  onSuccess,
  branchName,
  branchCode,
}: BranchLoginDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    setIsLoading(true);

    // Simulate authentication (in production, validate against backend)
    setTimeout(() => {
      // For demo purposes, accept any non-empty credentials
      if (username.trim() && password.trim()) {
        // Store branch access token
        const accessToken = {
          branchCode,
          username,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(`branch_access_${branchCode}`, JSON.stringify(accessToken));

        toast({
          title: 'Login Successful',
          description: `Access granted to ${branchName}`,
        });

        setUsername('');
        setPassword('');
        setIsLoading(false);
        onSuccess();
      } else {
        toast({
          title: 'Login Failed',
          description: 'Please enter valid credentials',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }, 800);
  };

  const handleCancel = () => {
    setUsername('');
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Branch Access Required</DialogTitle>
              <DialogDescription className="text-sm">
                {branchName} • {branchCode}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Please enter your credentials to access this branch
          </p>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleLogin} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
            {isLoading ? 'Authenticating...' : 'Login'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
