import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, User, Mail, Phone, MapPin, Calendar, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
  icon?: string;
}

export default function LoginPreferences() {
  const { toast } = useToast();
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [allowGuest, setAllowGuest] = useState(true);
  const [allowRegistered, setAllowRegistered] = useState(false);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [enableSocialLogin, setEnableSocialLogin] = useState(false);
  
  const [loginFields, setLoginFields] = useState<LoginField[]>([
    { id: '1', name: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name', icon: 'User' },
    { id: '2', name: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com', icon: 'Mail' },
    { id: '3', name: 'Contact Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567', icon: 'Phone' },
  ]);

  const [newField, setNewField] = useState<Omit<LoginField, 'id'>>({
    name: '',
    type: 'text',
    required: false,
    placeholder: '',
    icon: 'User'
  });

  useEffect(() => {
    const saved = localStorage.getItem('zervos_login_prefs');
    if (saved) {
      const data = JSON.parse(saved);
      setAllowGuest(data.allowGuest ?? true);
      setAllowRegistered(data.allowRegistered ?? false);
      setRequireEmailVerification(data.requireEmailVerification ?? false);
      setEnableSocialLogin(data.enableSocialLogin ?? false);
      if (data.loginFields) setLoginFields(data.loginFields);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('zervos_login_prefs', JSON.stringify({
      allowGuest,
      allowRegistered,
      requireEmailVerification,
      enableSocialLogin,
      loginFields
    }));
    toast({ title: "Success", description: "Login preferences updated successfully" });
  };

  const handleAddField = () => {
    const field: LoginField = {
      id: Date.now().toString(),
      ...newField
    };
    setLoginFields([...loginFields, field]);
    setAddFieldOpen(false);
    setNewField({
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
      icon: 'User'
    });
    toast({ title: "Success", description: "Custom field added" });
  };

  const handleDeleteField = (id: string) => {
    setLoginFields(loginFields.filter(field => field.id !== id));
    toast({ title: "Success", description: "Field removed" });
  };

  const handleToggleRequired = (id: string) => {
    setLoginFields(loginFields.map(field => 
      field.id === id ? { ...field, required: !field.required } : field
    ));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...loginFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      setLoginFields(newFields);
    }
  };

  const getFieldIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      User, Mail, Phone, MapPin, Calendar, Hash
    };
    const Icon = icons[iconName] || User;
    return <Icon size={16} />;

  };
