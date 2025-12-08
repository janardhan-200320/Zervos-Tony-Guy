// WhatsApp E-Bill Service using Waha API
export interface WhatsAppConfig {
  enabled: boolean;
  apiUrl: string;
  sessionName: string;
  phoneNumber: string;
  apiKey?: string;
  billTemplate: string;
  autoSendBills?: boolean;
  testMode?: boolean;
}

export interface BillData {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
}

export interface SendResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export interface ConnectionResult {
  connected: boolean;
  status?: string;
  message: string;
  qrCode?: string;
}

class WhatsAppService {
  private getConfig(workspaceId: string = 'default'): WhatsAppConfig | null {
    try {
      const saved = localStorage.getItem(`whatsapp_config_${workspaceId}`);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  private formatPhoneNumber(phone: string, countryCode: string = '91'): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '');
    
    // Handle different phone number formats
    let formatted = cleaned;
    
    // Remove country code if already present
    if (formatted.startsWith(countryCode)) {
      formatted = formatted.substring(countryCode.length);
    }
    
    // Remove leading zero if present
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    
    // Validate phone number length (should be 10 digits for Indian numbers)
    if (formatted.length !== 10) {
      throw new Error('Invalid phone number format');
    }
    
    // Add country code and WhatsApp suffix
    return `${countryCode}${formatted}@c.us`;
  }

  private formatBillMessage(template: string, data: BillData): string {
    let message = template;
    
    // Replace simple variables with proper formatting
    const replacements = {
      '{{businessName}}': data.businessName,
      '{{invoiceNumber}}': data.invoiceNumber,
      '{{customerName}}': data.customerName,
      '{{date}}': data.date,
      '{{time}}': data.time,
      '{{subtotal}}': `₹${data.subtotal.toFixed(2)}`,
      '{{total}}': `₹${data.total.toFixed(2)}`,
      '{{paymentMethod}}': data.paymentMethod,
      '{{phone}}': data.businessPhone || '',
      '{{address}}': data.businessAddress || ''
    };

    // Apply all replacements
    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(key, 'g'), value);
    });
    
    // Handle optional discount field with conditional blocks
    if (data.discount && data.discount > 0) {
      message = message.replace(/\{\{#discount\}\}/g, '');
      message = message.replace(/\{\{\/discount\}\}/g, '');
      message = message.replace(/\{\{discount\}\}/g, `₹${data.discount.toFixed(2)}`);
    } else {
      message = message.replace(/\{\{#discount\}\}[\s\S]*?\{\{\/discount\}\}/g, '');
    }
    
    // Handle optional tax field with conditional blocks
    if (data.tax && data.tax > 0) {
      message = message.replace(/\{\{#tax\}\}/g, '');
      message = message.replace(/\{\{\/tax\}\}/g, '');
      message = message.replace(/\{\{tax\}\}/g, `₹${data.tax.toFixed(2)}`);
    } else {
      message = message.replace(/\{\{#tax\}\}[\s\S]*?\{\{\/tax\}\}/g, '');
    }
    
    // Format items list with proper currency
    const itemsList = data.items
      .map((item, idx) => {
        const itemTotal = (item.price * item.quantity / 100).toFixed(2);
        return `${idx + 1}. ${item.name} × ${item.quantity} - ₹${itemTotal}`;
      })
      .join('\n');
    message = message.replace(/\{\{items\}\}/g, itemsList);
    
    return message;
  }

  async sendBill(
    billData: BillData,
    workspaceId: string = 'default'
  ): Promise<SendResult> {
    try {
      // Get configuration
      const config = this.getConfig(workspaceId);
      
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WhatsApp integration is not enabled',
          error: 'INTEGRATION_DISABLED'
        };
      }

      // Validate customer phone
      if (!billData.customerPhone) {
        return {
          success: false,
          message: 'Customer phone number is required',
          error: 'PHONE_REQUIRED'
        };
      }

      // Check if bill already sent
      if (this.isBillSent(billData.invoiceNumber, workspaceId)) {
        return {
          success: false,
          message: 'Bill already sent to this customer',
          error: 'DUPLICATE_BILL'
        };
      }

      // Format phone number with validation
      let chatId: string;
      try {
        chatId = this.formatPhoneNumber(billData.customerPhone);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Invalid phone number format',
          error: 'INVALID_PHONE'
        };
      }

      // Format message using template
      const message = this.formatBillMessage(config.billTemplate, billData);

      // Send via Waha API
      const response = await fetch(`${config.apiUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        },
        body: JSON.stringify({
          session: config.sessionName,
          chatId: chatId,
          text: message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send WhatsApp message';
        
        // Parse error for better user feedback
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Log the sent bill
      this.logSentBill(billData.invoiceNumber, billData.customerPhone, workspaceId);

      return {
        success: true,
        message: 'Bill sent successfully via WhatsApp',
        messageId: result.id || result.messageId
      };

    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send WhatsApp message',
        error: error.code || 'SEND_FAILED'
      };
    }
  }

  async sendTestMessage(
    phoneNumber: string,
    workspaceId: string = 'default'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config) {
        return {
          success: false,
          message: 'WhatsApp configuration not found'
        };
      }

      // Validate phone number first
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message || 'Invalid phone number'
        };
      }

      const chatId = this.formatPhoneNumber(phoneNumber);
      const businessName = localStorage.getItem('zervos_company') 
        ? JSON.parse(localStorage.getItem('zervos_company')!).name 
        : 'Zervos';

      const response = await fetch(`${config.apiUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        },
        body: JSON.stringify({
          session: config.sessionName,
          chatId: chatId,
          text: `🧪 *Test Message from ${businessName}*\n\nYour WhatsApp E-Bill system is working perfectly! ✅\n\nYou'll receive your bills automatically via WhatsApp.`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send test message';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return {
        success: true,
        message: 'Test message sent successfully'
      };

    } catch (error: any) {
      console.error('Test message error:', error);
      
      let errorMessage = error.message || 'Failed to send test message';
      
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to WhatsApp server. Check if Waha is running.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async checkConnection(
    workspaceId: string = 'default'
  ): Promise<ConnectionResult> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config) {
        return {
          connected: false,
          message: 'Configuration not found'
        };
      }

      const response = await fetch(`${config.apiUrl}/api/sessions/${config.sessionName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-Api-Key': config.apiKey })
        }
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();
      const isActive = data.status === 'WORKING' || data.status === 'ACTIVE';

      // Fetch QR code if session needs to be scanned
      let qrCode: string | undefined;
      if (data.status === 'SCAN_QR_CODE') {
        try {
          const qrResponse = await fetch(
            `${config.apiUrl}/api/screenshot?session=${config.sessionName}`,
            {
              headers: {
                ...(config.apiKey && { 'X-Api-Key': config.apiKey })
              }
            }
          );
          if (qrResponse.ok) {
            const blob = await qrResponse.blob();
            qrCode = URL.createObjectURL(blob);
          }
        } catch (err) {
          console.error('Could not fetch QR code:', err);
        }
      }

      return {
        connected: isActive,
        status: data.status,
        message: isActive ? 'Connected successfully' : 'Session not active',
        qrCode
      };

    } catch (error: any) {
      return {
        connected: false,
        message: error.message || 'Connection failed'
      };
    }
  }

  private logSentBill(invoiceNumber: string, customerPhone: string, workspaceId: string): void {
    try {
      const key = `whatsapp_sent_bills_${workspaceId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      existing.push({
        invoiceNumber,
        customerPhone,
        sentAt: new Date().toISOString()
      });

      // Keep only last 100 records
      if (existing.length > 100) {
        existing.shift();
      }

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to log sent bill:', error);
    }
  }

  getSentBillsHistory(workspaceId: string = 'default'): Array<{
    invoiceNumber: string;
    customerPhone: string;
    sentAt: string;
  }> {
    try {
      const key = `whatsapp_sent_bills_${workspaceId}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  isBillSent(invoiceNumber: string, workspaceId: string = 'default'): boolean {
    const history = this.getSentBillsHistory(workspaceId);
    return history.some(record => record.invoiceNumber === invoiceNumber);
  }

  // Clear sent bills history
  clearHistory(workspaceId: string = 'default'): void {
    try {
      const key = `whatsapp_sent_bills_${workspaceId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  // Get statistics
  getStatistics(workspaceId: string = 'default'): {
    totalSent: number;
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
  } {
    const history = this.getSentBillsHistory(workspaceId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalSent: history.length,
      sentToday: history.filter(r => new Date(r.sentAt) >= today).length,
      sentThisWeek: history.filter(r => new Date(r.sentAt) >= weekStart).length,
      sentThisMonth: history.filter(r => new Date(r.sentAt) >= monthStart).length
    };
  }

  // Validate phone number format
  validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
    try {
      // Remove all non-numeric characters
      const cleaned = phone.replace(/[^0-9]/g, '');
      
      // Check if empty
      if (!cleaned) {
        return { valid: false, message: 'Phone number is required' };
      }
      
      // Remove country code if present
      let digits = cleaned;
      if (digits.startsWith('91')) {
        digits = digits.substring(2);
      }
      
      // Remove leading zero
      if (digits.startsWith('0')) {
        digits = digits.substring(1);
      }
      
      // Check length (should be 10 digits for Indian numbers)
      if (digits.length !== 10) {
        return { valid: false, message: 'Phone number must be 10 digits' };
      }
      
      // Check if it starts with valid digit (6-9 for Indian mobile numbers)
      if (!['6', '7', '8', '9'].includes(digits[0])) {
        return { valid: false, message: 'Invalid mobile number format' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, message: 'Invalid phone number format' };
    }
  }

  // Bulk send bills (for multiple customers)
  async sendBulkBills(
    bills: BillData[],
    workspaceId: string = 'default',
    onProgress?: (current: number, total: number, result: SendResult) => void
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{ bill: BillData; result: SendResult }>;
  }> {
    const results: Array<{ bill: BillData; result: SendResult }> = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      
      // Add delay between messages to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const result = await this.sendBill(bill, workspaceId);
      results.push({ bill, result });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      if (onProgress) {
        onProgress(i + 1, bills.length, result);
      }
    }

    return { successful, failed, results };
  }

  // Export history as CSV
  exportHistoryAsCSV(workspaceId: string = 'default'): string {
    const history = this.getSentBillsHistory(workspaceId);
    
    const headers = ['Invoice Number', 'Customer Phone', 'Sent At'];
    const rows = history.map(record => [
      record.invoiceNumber,
      record.customerPhone,
      new Date(record.sentAt).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }

  // Download history as CSV file
  downloadHistory(workspaceId: string = 'default'): void {
    const csv = this.exportHistoryAsCSV(workspaceId);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-bills-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
