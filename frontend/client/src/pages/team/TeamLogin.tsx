import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Manager' | 'Admin' | 'Super Admin';
}

export default function TeamLogin() {
  const [, setLocation] = useLocation();
  const [q, setQ] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_salespersons');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setMembers(arr.map((p: any) => ({
            id: p.id,
            name: p.name || p.email || 'Member',
            email: p.email || '',
            role: p.role || 'Staff'
          })));
        }
      }
    } catch {}
  }, []);

  const filtered = useMemo(
    () => members.filter(m => (m.name + ' ' + m.email).toLowerCase().includes(q.toLowerCase())),
    [members, q]
  );

  const handleLogin = (m: TeamMember) => {
    const session = { id: m.id, name: m.name, email: m.email, role: m.role };
    localStorage.setItem('zervos_team_session', JSON.stringify(session));
    setLocation('/team');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6 space-y-4">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Team Portal</h1>
            <p className="text-gray-600 text-sm">Sign in as a team member to view your calls and appointments</p>
          </div>
          <div className="space-y-2">
            <Label>Search team members</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name or email" />
          </div>
          <div className="max-h-80 overflow-y-auto divide-y border rounded-md">
            {filtered.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.email} • {m.role}</div>
                </div>
                <Button size="sm" onClick={() => handleLogin(m)}>Sign in</Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No team members found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
