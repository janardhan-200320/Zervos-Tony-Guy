import type { Request, Response } from "express";
import { storage } from "./storage";
import { sql } from "drizzle-orm";

// Flow Node Types
export interface FlowNode {
  id: string;
  type: 'message' | 'buttons' | 'list' | 'condition' | 'api_call' | 'end';
  data: {
    message?: string;
    buttons?: Array<{ id: string; text: string; nextNodeId: string }>;
    listItems?: Array<{ id: string; title: string; description?: string; nextNodeId: string }>;
    condition?: { variable: string; operator: string; value: string; trueNodeId: string; falseNodeId: string };
    apiEndpoint?: string;
    endMessage?: string;
  };
  nextNodeId?: string; // For linear flows
}

export interface BotFlowData {
  nodes: FlowNode[];
  startNodeId: string;
  variables?: Record<string, string>; // Store dynamic variables
}

// WhatsApp webhook message structure
export interface WhatsAppIncomingMessage {
  from: string; // Phone number
  id: string; // Message ID
  timestamp: string;
  type: 'text' | 'button' | 'interactive';
  text?: { body: string };
  button?: { payload: string; text: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export class BotEngine {
  // Process incoming WhatsApp message
  async processIncomingMessage(message: WhatsAppIncomingMessage): Promise<void> {
    try {
      console.log("📨 Processing incoming message from:", message.from);

      // Find or create conversation (using storage - simplified for in-memory)
      // In a real implementation with database, we'd query properly
      const conversations = await storage.getConversations();
      let conversation = conversations.find(c => 
        c.phoneNumber === message.from && c.status === "active"
      );

      if (!conversation) {
        // Create new conversation through API (simplified)
        conversation = {
          id: `conv_${Date.now()}`,
          phoneNumber: message.from,
          status: "active" as const,
          sessionData: {},
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      }

      // Determine the flow to execute
      const flow = await this.determineFlow(message, conversation);

      if (!flow) {
        console.log("❌ No matching flow found");
        await this.sendFallbackMessage(conversation);
        return;
      }

      // Execute the flow
      await this.executeFlow(flow, conversation, message);

    } catch (error) {
      console.error("❌ Error processing message:", error);
      throw error;
    }
  }

  // Extract text content from different message types
  private extractMessageContent(message: WhatsAppIncomingMessage): string {
    if (message.type === 'text' && message.text) {
      return message.text.body;
    }
    if (message.type === 'button' && message.button) {
      return message.button.text;
    }
    if (message.type === 'interactive' && message.interactive?.button_reply) {
      return message.interactive.button_reply.title;
    }
    if (message.type === 'interactive' && message.interactive?.list_reply) {
      return message.interactive.list_reply.title;
    }
    return '';
  }

  // Determine which flow to trigger
  private async determineFlow(message: WhatsAppIncomingMessage, conversation: any) {
    // If conversation has an active flow, continue it
    if (conversation.currentFlowId) {
      const flows = await storage.getBotFlows();
      const currentFlow = flows.find(f => f.id === conversation.currentFlowId);
      if (currentFlow) return currentFlow;
    }

    // Check for keyword-triggered flows
    const content = this.extractMessageContent(message).toLowerCase().trim();
    
    // Get all active flows ordered by priority
    const allFlows = await storage.getBotFlows();
    const activeFlows = allFlows
      .filter(f => f.isActive === "true")
      .sort((a, b) => parseInt(b.priority || '0') - parseInt(a.priority || '0'));

    for (const flow of activeFlows) {
      // Welcome flow (for first message or "hi", "hello", "start")
      if (flow.triggerType === 'welcome' && 
          (content === 'hi' || content === 'hello' || content === 'start' || content === 'hey')) {
        return flow;
      }

      // Keyword trigger
      if (flow.triggerType === 'keyword' && 
          flow.triggerValue && 
          content.includes(flow.triggerValue.toLowerCase())) {
        return flow;
      }

      // Button/Interactive trigger
      if (flow.triggerType === 'button' && message.type === 'button') {
        return flow;
      }
    }

    return null;
  }

  // Execute the bot flow
  private async executeFlow(flow: any, conversation: any, message: WhatsAppIncomingMessage) {
    try {
      const flowData = flow.flowData as BotFlowData;
      
      console.log(`🤖 Executing flow: ${flow.name}`);

      // Start executing from the first node
      let currentNodeId = flowData.startNodeId;
      const sessionData = conversation.sessionData || {};

      // Handle button/interactive responses
      if (message.type === 'button' || message.type === 'interactive') {
        currentNodeId = await this.handleInteractiveResponse(message, conversation, flowData);
      }

      // Execute nodes
      await this.executeNode(currentNodeId, flowData, conversation, sessionData);

    } catch (error) {
      console.error("❌ Error executing flow:", error);
      throw error;
    }
  }

  // Handle button or list reply
  private async handleInteractiveResponse(
    message: WhatsAppIncomingMessage, 
    conversation: any, 
    flowData: BotFlowData
  ): Promise<string> {
    let selectedId = '';

    if (message.button?.payload) {
      selectedId = message.button.payload;
    } else if (message.interactive?.button_reply?.id) {
      selectedId = message.interactive.button_reply.id;
    } else if (message.interactive?.list_reply?.id) {
      selectedId = message.interactive.list_reply.id;
    }

    // Find the node that contains this button/list item
    const currentNode = flowData.nodes.find(n => n.id === conversation.currentNodeId);
    if (!currentNode) return flowData.startNodeId;

    // Find the next node based on button selection
    if (currentNode.data.buttons) {
      const button = currentNode.data.buttons.find(b => b.id === selectedId);
      if (button?.nextNodeId) return button.nextNodeId;
    }

    if (currentNode.data.listItems) {
      const item = currentNode.data.listItems.find(i => i.id === selectedId);
      if (item?.nextNodeId) return item.nextNodeId;
    }

    return currentNode.nextNodeId || flowData.startNodeId;
  }

  // Execute a specific node in the flow
  private async executeNode(
    nodeId: string, 
    flowData: BotFlowData, 
    conversation: any,
    sessionData: Record<string, any>
  ): Promise<void> {
    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error("❌ Node not found:", nodeId);
      return;
    }

    console.log(`📍 Executing node: ${node.type}`);

    switch (node.type) {
      case 'message':
        await this.sendTextMessage(conversation, node.data.message || '');
        // Auto-proceed to next node if exists
        if (node.nextNodeId) {
          await this.executeNode(node.nextNodeId, flowData, conversation, sessionData);
        }
        break;

      case 'buttons':
        await this.sendButtonMessage(conversation, node.data.message || '', node.data.buttons || []);
        // Wait for user response (don't auto-proceed)
        break;

      case 'list':
        await this.sendListMessage(conversation, node.data.message || '', node.data.listItems || []);
        // Wait for user response
        break;

      case 'condition':
        // Evaluate condition and proceed to appropriate node
        const nextNode = await this.evaluateCondition(node.data.condition!, sessionData);
        if (nextNode) {
          await this.executeNode(nextNode, flowData, conversation, sessionData);
        }
        break;

      case 'api_call':
        // Make external API call (future enhancement)
        console.log("🔌 API Call node - not yet implemented");
        if (node.nextNodeId) {
          await this.executeNode(node.nextNodeId, flowData, conversation, sessionData);
        }
        break;

      case 'end':
        await this.sendTextMessage(conversation, node.data.endMessage || 'Thank you!');
        await this.endConversation(conversation);
        break;
    }
  }

  // Send text message
  private async sendTextMessage(conversation: any, message: string): Promise<void> {
    // This will be implemented with actual WhatsApp API call
    console.log("📤 Sending text:", message);
    // TODO: Call actual wabaService.sendTextMessage()
  }

  // Send button message
  private async sendButtonMessage(
    conversation: any, 
    message: string, 
    buttons: Array<{ id: string; text: string; nextNodeId: string }>
  ): Promise<void> {
    console.log("📤 Sending buttons:", message);
    // TODO: Call actual wabaService.sendButtonMessage()
  }

  // Send list message
  private async sendListMessage(
    conversation: any,
    message: string,
    items: Array<{ id: string; title: string; description?: string; nextNodeId: string }>
  ): Promise<void> {
    console.log("📤 Sending list:", message);
    // TODO: Call actual wabaService.sendListMessage()
  }

  // Evaluate condition
  private async evaluateCondition(
    condition: { variable: string; operator: string; value: string; trueNodeId: string; falseNodeId: string },
    sessionData: Record<string, any>
  ): Promise<string> {
    const varValue = sessionData[condition.variable];
    
    let result = false;
    switch (condition.operator) {
      case 'equals':
        result = varValue === condition.value;
        break;
      case 'contains':
        result = String(varValue).includes(condition.value);
        break;
      case 'greater_than':
        result = Number(varValue) > Number(condition.value);
        break;
    }

    return result ? condition.trueNodeId : condition.falseNodeId;
  }

  // Send fallback message
  private async sendFallbackMessage(conversation: any): Promise<void> {
    const fallbackMessage = "I'm sorry, I didn't understand that. Type 'help' to see available options.";
    await this.sendTextMessage(conversation, fallbackMessage);
  }

  // End conversation
  private async endConversation(conversation: any): Promise<void> {
    console.log("✅ Conversation ended");
    // In a real implementation, update conversation status in storage
  }
}

export const botEngine = new BotEngine();
