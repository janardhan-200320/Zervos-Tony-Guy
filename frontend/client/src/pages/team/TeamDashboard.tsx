import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ClipboardList, Shield } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  description?: string;
  meetingMode?: string;
  duration?: { hours: string; minutes: string };
  assignedSalespersons?: string[];
}

interface Appointment {
  id: string;
  customerName: string;
  serviceName: string;
  serviceId?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function TeamDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [calls, setCalls] = useState<Array<{ id: string; name: string; workspace?: string }>>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('zervos_team_session');
    if (!raw) {
      setLocation('/team/login');
      return;
    }
    try {
      const s = JSON.parse(raw);
      if (!s?.id) {
        setLocation('/team/login');
        return;
      }
      setSession(s);
    } catch {
      setLocation('/team/login');
    }
  }, [setLocation]);

  // Load assigned calls across all workspaces
  useEffect(() => {
    if (!session?.id) return;
    const getKeysByPrefix = (prefix: string) => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      return keys;
    };
    const callKeys = [...getKeysByPrefix('zervos_sales_calls::'), 'zervos_sales_calls'];
    const mine: Array<{ id: string; name: string; workspace?: string }> = [];
    for (const key of callKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const c of arr) {
            if (Array.isArray(c?.assignedSalespersons) && c.assignedSalespersons.includes(session.id)) {
              mine.push({ id: c.id, name: c.name, workspace: key.includes('::') ? key.split('::')[1] : undefined });
            }
          }
        }
      } catch {}
    }
    setCalls(mine);
  }, [session?.id]);

  // Load my appointments
  useEffect(() => {
    if (!session?.id) return;
    fetch(`/api/appointments?assignedMemberId=${encodeURIComponent(session.id)}`)
      .then(res => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(() => setAppointments([]));
  }, [session?.id]);

  const filteredCalls = useMemo(() =>
    calls.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase())), [calls, searchQ]
  );

  const handleLogout = () => {
    localStorage.removeItem('zervos_team_session');
    setLocation('/team/login');
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {session.name}</h1>
            <p className="text-gray-600 text-sm">Role: {session.role}</p>
          </div>
          <div className="flex items-center gap-2">
            {(session.role === 'Admin' || session.role === 'Super Admin' || session.role === 'Manager') && (
              <Button variant="outline" onClick={() => setLocation('/dashboard/admin-center')} className="gap-2">
                <Shield size={16} /> Admin Center
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Assigned Calls</div>
                <div className="text-2xl font-bold">{calls.length}</div>
              </div>
              <ClipboardList className="text-purple-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Appointments</div>
                <div className="text-2xl font-bold">{appointments.length}</div>
              </div>
              <Calendar className="text-purple-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Search Calls</div>
              <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Type to filter" />
            </CardContent>
          </Card>
        </div>

        {/* Calls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="font-semibold text-gray-900">My Calls</div>
              {filteredCalls.length === 0 ? (
                <div className="text-sm text-gray-500">No calls assigned</div>
              ) : (
                <div className="space-y-2">
                  {filteredCalls.map(c => (
                    <div key={c.id} className="p-3 border rounded-md">
                      <div className="font-medium">{c.name}</div>
                      {c.workspace && (
                        <div className="text-xs text-gray-500">Workspace: {c.workspace}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="font-semibold text-gray-900">My Appointments</div>
              {appointments.length === 0 ? (
                <div className="text-sm text-gray-500">No appointments found</div>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 10).map(a => (
                    <div key={a.id} className="p-3 border rounded-md flex items-center justify-between">
                      <div>
                        <div className="font-medium">{a.customerName}</div>
                        <div className="text-xs text-gray-500">{a.date} • {a.time}</div>
                      </div>
                      <div className="text-sm text-gray-700">{a.serviceName}</div>
                    </div>
                  ))}
                  {appointments.length > 10 && (
                    <div className="text-xs text-gray-500">+{appointments.length - 10} more…</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
