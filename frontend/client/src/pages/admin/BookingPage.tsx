import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Palette, Settings, Globe, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingPageSettings {
  businessName: string;
  bookingUrl: string;
  welcomeMessage: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  showLogo: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  socialImage: string;
}

export default function BookingPage() {
  const { toast } = useToast();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [settings, setSettings] = useState<BookingPageSettings>({
    businessName: 'Zervos Bookings',
    bookingUrl: 'zervos.com/book',
    welcomeMessage: 'Book your appointment in a few simple steps: Choose a service, pick your date and time, and fill in your details. See you soon!',
    backgroundColor: '#6366f1',
    textColor: '#ffffff',
    buttonColor: '#ffffff',
    showLogo: true,
    metaTitle: 'Book Your Appointment | Zervos',
    metaDescription: 'Schedule your appointment online quickly and easily',
    metaKeywords: 'booking, appointment, schedule',
    socialImage: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('zervos_booking_page');
    if (saved) {
      setSettings(JSON.parse(saved));
    } else {
      const orgData = localStorage.getItem('zervos_organization');
      if (orgData) {
        const org = JSON.parse(orgData);
        setSettings(prev => ({
          ...prev,
          businessName: org.businessName || prev.businessName,
          bookingUrl: `${org.businessName?.toLowerCase().replace(/\s+/g, '')}.zervos.com` || prev.bookingUrl
        }));
      }
    }
  }, []);

  const saveSettings = (updated: BookingPageSettings) => {
    localStorage.setItem('zervos_booking_page', JSON.stringify(updated));
    setSettings(updated);
    toast({
      title: "Success",
      description: "Booking page settings saved successfully",
    });
  };

  const handleSaveCustomization = () => {
    saveSettings(settings);
    setCustomizeOpen(false);
  };

  const handleSaveSEO = () => {
    saveSettings(settings);
    setSeoOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`https://${settings.bookingUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Booking URL copied to clipboard",
    });
  };

  const handleOpenBookingPage = () => {
    window.open(`https://${settings.bookingUrl}`, '_blank');
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Business Booking Page</h1>
          <p className="text-gray-600 mt-1">Customize your public booking page</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
            <Share2 size={16} />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenBookingPage}>
            <ExternalLink size={16} />
            Preview
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div 
          className="h-64 relative transition-colors"
          style={{ backgroundColor: settings.backgroundColor }}
        >
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: settings.textColor }}>
            <h2 className="text-4xl font-bold mb-2">{settings.businessName}</h2>
            
            <div className="flex gap-4 mt-8">
              <Button 
                className="gap-2"
                style={{ 
                  backgroundColor: settings.buttonColor, 
                  color: settings.backgroundColor 
                }}
              >
                <ExternalLink size={16} />
                Open Bookings Page
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                style={{ 
                  borderColor: settings.textColor, 
                  color: settings.textColor,
                  backgroundColor: 'transparent'
                }}
                onClick={() => setCustomizeOpen(true)}
              >
                <Palette size={16} />
                Themes and Layouts
              </Button>
            </div>
            
            <p className="mt-8 text-sm max-w-2xl text-center px-4" style={{ color: settings.textColor }}>
              {settings.welcomeMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Palette className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Page Customization</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Customize colors, fonts, and layout</p>
          <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)}>Configure</Button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe className="text-green-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">SEO Settings</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Optimize your page for search engines</p>
          <Button variant="outline" size="sm" onClick={() => setSeoOpen(true)}>Configure</Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="text-purple-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Booking URL</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2 truncate">{settings.bookingUrl}</p>
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
        </div>
      </div>

      {/* Customization Modal */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Booking Page</DialogTitle>
            <DialogDescription>Personalize the look and feel of your booking page</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="branding">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
            </TabsList>
            <TabsContent value="branding" className="space-y-4 mt-4">
              <div>
                <Label>Business Name</Label>
                <Input
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>
              <div>
                <Label>Welcome Message</Label>
                <Textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  placeholder="Welcome message for your customers"
                  rows={4}
                />
              </div>
              <div>
                <Label>Booking URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.bookingUrl}
                    onChange={(e) => setSettings({ ...settings, bookingUrl: e.target.value })}
                    placeholder="your-business.zervos.com"
                  />
                  <Button variant="outline" onClick={copyToClipboard}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Show Logo</Label>
                  <p className="text-xs text-gray-500">Display your business logo</p>
                </div>
                <Switch
                  checked={settings.showLogo}
                  onCheckedChange={(checked) => setSettings({ ...settings, showLogo: checked })}
                />
              </div>
            </TabsContent>
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div>
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.backgroundColor}
                    onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.textColor}
                    onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div>
                <Label>Button Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.buttonColor}
                    onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.buttonColor}
                    onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCustomization}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEO Modal */}
      <Dialog open={seoOpen} onOpenChange={setSeoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>SEO Settings</DialogTitle>
            <DialogDescription>Optimize your booking page for search engines</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Meta Title</Label>
              <Input
                value={settings.metaTitle}
                onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                placeholder="Book Your Appointment | Your Business"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 50-60 characters</p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea
                value={settings.metaDescription}
                onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                placeholder="Schedule your appointment online quickly and easily..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 150-160 characters</p>
            </div>
            <div>
              <Label>Meta Keywords</Label>
              <Input
                value={settings.metaKeywords}
                onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
                placeholder="booking, appointment, schedule"
              />
              <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
            </div>
            <div>
              <Label>Social Media Image URL</Label>
              <Input
                value={settings.socialImage}
                onChange={(e) => setSettings({ ...settings, socialImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">Image shown when shared on social media (1200x630px recommended)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeoOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSEO}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Booking Page</DialogTitle>
            <DialogDescription>Share your booking link with customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Booking URL</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={`https://${settings.bookingUrl}`}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyToClipboard}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=https://${settings.bookingUrl}&text=Book your appointment with ${settings.businessName}`, '_blank')}
              >
                Share on Twitter
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://${settings.bookingUrl}`, '_blank')}
              >
                Share on Facebook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
