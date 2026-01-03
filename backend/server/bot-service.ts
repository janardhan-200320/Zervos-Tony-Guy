import type { Conversation, BotMessage } from "../shared/schema";

// WhatsApp Business API Service for Bot Messages
export interface WABAConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
}

export interface ButtonAction {
  id: string;
  title: string; // Max 20 chars
}

export interface ListItem {
  id: string;
  title: string; // Max 24 chars
  description?: string; // Max 72 chars
}

export interface ListSection {
  title: string;
  rows: ListItem[];
}

export class BotService {
  private baseUrl = "https://graph.facebook.com";

  constructor(private config: WABAConfig) {}

  // Get config from localStorage or environment
  private getConfig(): WABAConfig {
    // In production, this should come from database or secure storage
    return this.config;
  }

  // Send simple text message
  async sendTextMessage(to: string, text: string): Promise<any> {
    const config = this.getConfig();
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    };

    return await this.makeRequest(url, payload, config.accessToken);
  }

  // Send interactive button message (max 3 buttons)
  async sendButtonMessage(
    to: string, 
    bodyText: string, 
    buttons: ButtonAction[],
    headerText?: string,
    footerText?: string
  ): Promise<any> {
    if (buttons.length > 3) {
      throw new Error("Maximum 3 buttons allowed");
    }

    const config = this.getConfig();
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const interactive: any = {
      type: "button",
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map(btn => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title.substring(0, 20) // Truncate to 20 chars
          }
        }))
      }
    };

    if (headerText) {
      interactive.header = {
        type: "text",
        text: headerText
      };
    }

    if (footerText) {
      interactive.footer = {
        text: footerText
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: interactive
    };

    return await this.makeRequest(url, payload, config.accessToken);
  }

  // Send interactive list message (max 10 items per section, max 10 sections)
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonText: string, // Text shown on list button
    sections: ListSection[],
    headerText?: string,
    footerText?: string
  ): Promise<any> {
    const config = this.getConfig();
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const interactive: any = {
      type: "list",
      body: {
        text: bodyText
      },
      action: {
        button: buttonText.substring(0, 20), // Button text max 20 chars
        sections: sections.map(section => ({
          title: section.title,
          rows: section.rows.map(row => ({
            id: row.id,
            title: row.title.substring(0, 24), // Max 24 chars
            description: row.description?.substring(0, 72) // Max 72 chars
          }))
        }))
      }
    };

    if (headerText) {
      interactive.header = {
        type: "text",
        text: headerText
      };
    }

    if (footerText) {
      interactive.footer = {
        text: footerText
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: interactive
    };

    return await this.makeRequest(url, payload, config.accessToken);
  }

  // Send quick reply buttons (same as button message but optimized for quick replies)
  async sendQuickReplyMessage(
    to: string,
    text: string,
    quickReplies: ButtonAction[]
  ): Promise<any> {
    return await this.sendButtonMessage(to, text, quickReplies);
  }

  // Send media message (image, video, document)
  async sendMediaMessage(
    to: string,
    mediaType: 'image' | 'video' | 'document',
    mediaUrl: string,
    caption?: string
  ): Promise<any> {
    const config = this.getConfig();
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const mediaObject: any = {
      link: mediaUrl
    };

    if (caption) {
      mediaObject.caption = caption;
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: mediaType,
      [mediaType]: mediaObject
    };

    return await this.makeRequest(url, payload, config.accessToken);
  }

  // Send template message (for notifications outside 24h window)
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = "en",
    components?: any[]
  ): Promise<any> {
    const config = this.getConfig();
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: language
        },
        components: components || []
      }
    };

    return await this.makeRequest(url, payload, config.accessToken);
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<any> {
    const config = this.getConfig();
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId
    };

    return await this.makeRequest(url, payload, config.accessToken);
  }

  // Make HTTP request to WhatsApp API
  private async makeRequest(url: string, payload: any, accessToken: string): Promise<any> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ WhatsApp API Error:", data);
        throw new Error(data.error?.message || "Failed to send message");
      }

      console.log("✅ Message sent successfully:", data);
      return data;

    } catch (error) {
      console.error("❌ Error sending WhatsApp message:", error);
      throw error;
    }
  }

  // Helper: Format phone number for WhatsApp
  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9]/g, '');
    
    // Remove leading zero
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if missing (default India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }
}

// Export factory function
export function createBotService(config: WABAConfig): BotService {
  return new BotService(config);
}
