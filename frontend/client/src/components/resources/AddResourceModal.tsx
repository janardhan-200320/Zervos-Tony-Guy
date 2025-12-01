import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InsertResource, Resource } from '@shared/schema';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: InsertResource) => Promise<void>;
  editResource?: Resource;
}

const RESOURCE_TYPES = ['Room', 'Equipment', 'Zoom Account', 'Vehicle', 'Other'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddResourceModal({ 
  isOpen, 
  onClose, 
  onSave,
  editResource 
}: AddResourceModalProps) {
  const [formData, setFormData] = useState<InsertResource>({
    name: editResource?.name || '',
    type: editResource?.type || '',
    description: editResource?.description || '',
    status: editResource?.status || 'available',
    capacity: editResource?.capacity || '',
    assignedUsers: editResource?.assignedUsers || [],
    availabilitySchedule: editResource?.availabilitySchedule || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.type) {
      setError('Name and Type are required');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editResource ? 'Edit Resource' : 'Add Resource'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="E.g: conference rooms, laptops, equipment, etc"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Workspaces */}
          <div className="space-y-2">
            <Label htmlFor="workspace">
              Workspaces <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Main Office">Main Office</SelectItem>
                <SelectItem value="Branch Office">Branch Office</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Shared">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {editResource ? 'Update' : 'Add'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
