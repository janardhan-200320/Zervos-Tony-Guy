// WhatsApp Business API (Meta Cloud API) Service
export interface WABAConfig {
  enabled: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  apiVersion: string; // e.g., "v18.0"
  webhookVerifyToken?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: TemplateComponent[];
  createdAt: string;
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: { header_text?: string[]; body_text?: string[][] };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface BroadcastMessage {
  id: string;
  name: string;
  templateName: string;
  templateLanguage: string;
  targetAudience: string[];
  variables?: Record<string, string>;
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
}

export interface SendMessageResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

class WABAService {
  private getConfig(workspaceId: string = 'default'): WABAConfig | null {
    try {
      const saved = localStorage.getItem(`waba_config_${workspaceId}`);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  saveConfig(config: WABAConfig, workspaceId: string = 'default'): void {
    localStorage.setItem(`waba_config_${workspaceId}`, JSON.stringify(config));
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '');
    
    // Remove leading zero if present
    let formatted = cleaned;
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    
    // Add country code if not present (assuming India +91)
    if (!formatted.startsWith('91') && formatted.length === 10) {
      formatted = '91' + formatted;
    }
    
    return formatted;
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'en',
    components?: any[],
    workspaceId: string = 'default'
  ): Promise<SendMessageResult> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WABA is not configured or enabled',
          error: 'CONFIG_MISSING'
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);
      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

      const payload: any = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language
          }
        }
      };

      if (components && components.length > 0) {
        payload.template.components = components;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send message');
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Message sent successfully',
        messageId: result.messages?.[0]?.id
      };

    } catch (error: any) {
      console.error('WABA send error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message',
        error: error.code || 'SEND_FAILED'
      };
    }
  }

  async sendTextMessage(
    to: string,
    text: string,
    workspaceId: string = 'default'
  ): Promise<SendMessageResult> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WABA is not configured or enabled',
          error: 'CONFIG_MISSING'
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);
      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: text }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send message');
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Message sent successfully',
        messageId: result.messages?.[0]?.id
      };

    } catch (error: any) {
      console.error('WABA send error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message',
        error: error.code || 'SEND_FAILED'
      };
    }
  }

  async getMessageTemplates(
    workspaceId: string = 'default'
  ): Promise<{ success: boolean; templates: MessageTemplate[]; error?: string }> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config || !config.enabled) {
        return {
          success: false,
          templates: [],
          error: 'WABA is not configured'
        };
      }

      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch templates');
      }

      const result = await response.json();

      return {
        success: true,
        templates: result.data || []
      };

    } catch (error: any) {
      console.error('WABA fetch templates error:', error);
      return {
        success: false,
        templates: [],
        error: error.message
      };
    }
  }

  async createMessageTemplate(
    template: Partial<MessageTemplate>,
    workspaceId: string = 'default'
  ): Promise<{ success: boolean; message: string; templateId?: string }> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WABA is not configured'
        };
      }

      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: template.name,
          language: template.language || 'en',
          category: template.category || 'MARKETING',
          components: template.components
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create template');
      }

      const result = await response.json();

      return {
        success: true,
        message: 'Template created successfully and submitted for approval',
        templateId: result.id
      };

    } catch (error: any) {
      console.error('WABA create template error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create template'
      };
    }
  }

  async testConnection(
    workspaceId: string = 'default'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = this.getConfig(workspaceId);
      
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WABA is not configured'
        };
      }

      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Meta API');
      }

      const result = await response.json();

      return {
        success: true,
        message: `Connected successfully! Phone: ${result.display_phone_number || result.verified_name}`
      };

    } catch (error: any) {
      console.error('WABA test connection error:', error);
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }

  // Broadcast helpers
  saveBroadcast(broadcast: BroadcastMessage, workspaceId: string = 'default'): void {
    const key = `waba_broadcasts_${workspaceId}`;
    const broadcasts = this.getBroadcasts(workspaceId);
    const index = broadcasts.findIndex(b => b.id === broadcast.id);
    
    if (index >= 0) {
      broadcasts[index] = broadcast;
    } else {
      broadcasts.push(broadcast);
    }
    
    localStorage.setItem(key, JSON.stringify(broadcasts));
  }

  getBroadcasts(workspaceId: string = 'default'): BroadcastMessage[] {
    try {
      const key = `waba_broadcasts_${workspaceId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  deleteBroadcast(broadcastId: string, workspaceId: string = 'default'): void {
    const broadcasts = this.getBroadcasts(workspaceId).filter(b => b.id !== broadcastId);
    localStorage.setItem(`waba_broadcasts_${workspaceId}`, JSON.stringify(broadcasts));
  }

  // ========== INTERACTIVE MESSAGES FOR BOT ==========

  // Send button message (max 3 buttons)
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string,
    workspaceId: string = 'default'
  ): Promise<SendMessageResult> {
    try {
      const config = this.getConfig(workspaceId);
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WABA is not configured or enabled',
          error: 'CONFIG_MISSING'
        };
      }

      if (buttons.length > 3) {
        throw new Error('Maximum 3 buttons allowed');
      }

      const phoneNumber = this.formatPhoneNumber(to);
      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

      const interactive: any = {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20)
            }
          }))
        }
      };

      if (headerText) {
        interactive.header = { type: 'text', text: headerText };
      }
      if (footerText) {
        interactive.footer = { text: footerText };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'interactive',
          interactive
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send button message');
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Button message sent successfully',
        messageId: result.messages?.[0]?.id
      };

    } catch (error: any) {
      console.error('Error sending button message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send button message',
        error: 'SEND_FAILED'
      };
    }
  }

  // Send list message (up to 10 items per section)
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    headerText?: string,
    footerText?: string,
    workspaceId: string = 'default'
  ): Promise<SendMessageResult> {
    try {
      const config = this.getConfig(workspaceId);
      if (!config || !config.enabled) {
        return {
          success: false,
          message: 'WABA is not configured or enabled',
          error: 'CONFIG_MISSING'
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);
      const apiUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

      const interactive: any = {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText.substring(0, 20),
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description?.substring(0, 72)
            }))
          }))
        }
      };

      if (headerText) {
        interactive.header = { type: 'text', text: headerText };
      }
      if (footerText) {
        interactive.footer = { text: footerText };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'interactive',
          interactive
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to send list message');
      }

      const result = await response.json();
      return {
        success: true,
        message: 'List message sent successfully',
        messageId: result.messages?.[0]?.id
      };

    } catch (error: any) {
      console.error('Error sending list message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send list message',
        error: 'SEND_FAILED'
      };
    }
  }
}

// Export singleton instance
export const wabaService = new WABAService();
