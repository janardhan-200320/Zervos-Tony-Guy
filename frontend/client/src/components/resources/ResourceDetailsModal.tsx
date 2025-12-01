import { useState, useEffect } from 'react';
import { X, Calendar, Users, Activity, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Resource, ResourceBooking } from '@shared/schema';

interface ResourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  onDelete: (id: string) => Promise<void>;
  onEdit: (resource: Resource) => void;
}

export default function ResourceDetailsModal({
  isOpen,
  onClose,
  resource,
  onDelete,
  onEdit,
}: ResourceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'users' | 'reports'>('overview');
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && resource) {
      fetchBookings();
      fetchStats();
    }
  }, [isOpen, resource]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/resource-bookings?resourceId=${resource.id}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/resources/${resource.id}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${resource.name}? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await onDelete(resource.id);
        onClose();
      } catch (error) {
        alert('Failed to delete resource');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    under_maintenance: 'bg-yellow-100 text-yellow-800',
    booked: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-lg">
                  {resource.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{resource.name}</h2>
                <p className="text-sm text-gray-500">{resource.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(resource)}>
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b -mb-px">
            <button
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('schedule')}
            >
              Schedule
            </button>
            <button
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Assigned Users
            </button>
            <button
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Resource Name
                  </label>
                  <p className="text-gray-900">{resource.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Status
                  </label>
                  <Badge className={statusColors[resource.status as keyof typeof statusColors]}>
                    {resource.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {resource.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{resource.description}</p>
                </div>
              )}

              {resource.capacity && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Capacity
                  </label>
                  <p className="text-gray-900">{resource.capacity} people</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Upcoming Bookings</h3>
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No bookings scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{booking.bookedBy}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.startTime).toLocaleString()} -{' '}
                            {new Date(booking.endTime).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{booking.status}</Badge>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-gray-600 mt-2">{booking.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 mb-4">Assigned Team Members</h3>
              {!resource.assignedUsers || resource.assignedUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No users assigned to this resource</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {resource.assignedUsers.map((userId) => (
                    <div
                      key={userId}
                      className="border rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {userId.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userId}</p>
                        <p className="text-sm text-gray-500">Team Member</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="font-medium text-gray-900 mb-4">Usage Statistics</h3>
              {stats ? (
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={20} className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Total Bookings
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.totalBookings}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={20} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Total Hours
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats.totalHours}h
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={20} className="text-green-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Utilization
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.utilizationPercentage}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Loading statistics...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
