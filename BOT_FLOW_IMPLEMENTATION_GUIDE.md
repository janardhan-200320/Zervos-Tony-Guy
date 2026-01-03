# 🤖 WhatsApp Bot Flow - Complete Implementation Guide

## ✅ IMPLEMENTATION COMPLETE

All bot flow components have been successfully implemented and integrated into your Zervos system.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Backend Components](#backend-components)
4. [Frontend Pages](#frontend-pages)
5. [How Messages Flow](#how-messages-flow)
6. [Configuration Steps](#configuration-steps)
7. [Creating Your First Bot Flow](#creating-your-first-bot-flow)
8. [Testing the Bot](#testing-the-bot)
9. [API Reference](#api-reference)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER ON WHATSAPP                        │
│              (Sends message via WhatsApp)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                META WHATSAPP API                         │
│         (Receives & forwards to your webhook)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│            YOUR SERVER - WEBHOOK ENDPOINT                │
│         POST /api/webhooks/whatsapp                      │
│         • Verifies message authenticity                  │
│         • Extracts message data                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  BOT ENGINE                              │
│         (bot-engine.ts)                                  │
│         • Finds/creates conversation                     │
│         • Determines which flow to trigger               │
│         • Processes current node in flow                 │
│         • Tracks state & session data                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  BOT SERVICE                             │
│         (bot-service.ts & waba-service.ts)               │
│         • Sends text messages                            │
│         • Sends button messages (max 3)                  │
│         • Sends list messages (menu)                     │
│         • Sends media (images, videos)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              META WHATSAPP API                           │
│         (Delivers message to user)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                USER RECEIVES MESSAGE                     │
│         (Sees bot response on WhatsApp)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### New Tables Added

#### 1. **bot_flows** - Store bot conversation flows
```typescript
{
  id: string (UUID)
  name: string                    // "Welcome Flow", "Booking Assistant"
  description: string             // Brief description
  triggerType: string            // 'keyword', 'button', 'menu', 'welcome'
  triggerValue: string           // e.g., "book", "help", "hi"
  isActive: string               // 'true' or 'false'
  flowData: json                 // Complete flow structure
  priority: string               // Higher = checked first
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. **conversations** - Track user chat sessions
```typescript
{
  id: string (UUID)
  phoneNumber: string            // User's WhatsApp number
  customerName: string           // Optional name
  currentFlowId: string          // Active flow ID
  currentNodeId: string          // Current position in flow
  sessionData: json              // Store collected user inputs
  status: string                 // 'active', 'closed', 'waiting'
  lastMessageAt: timestamp
  createdAt: timestamp
}
```

#### 3. **bot_messages** - Store all messages
```typescript
{
  id: string (UUID)
  conversationId: string
  direction: string              // 'inbound' or 'outbound'
  messageType: string            // 'text', 'button', 'list', 'template'
  content: string                // Message text
  metadata: json                 // Buttons, list items, etc.
  wabaMessageId: string          // WhatsApp message ID
  status: string                 // 'sent', 'delivered', 'read', 'failed'
  error: string
  createdAt: timestamp
}
```

#### 4. **bot_analytics** - Track performance
```typescript
{
  id: string (UUID)
  flowId: string
  conversationId: string
  eventType: string              // 'flow_started', 'flow_completed', 'node_reached'
  eventData: json
  timestamp: timestamp
}
```

---

## ⚙️ Backend Components

### 1. **bot-engine.ts** - Core Bot Logic

**Location:** `backend/server/bot-engine.ts`

**Key Features:**
- ✅ Process incoming WhatsApp messages
- ✅ Find or create conversation sessions
- ✅ Determine which flow to execute
- ✅ Execute flow nodes sequentially
- ✅ Handle button & list responses
- ✅ Track analytics events
- ✅ Manage conversation state

**Main Methods:**
- `processIncomingMessage()` - Entry point for all messages
- `executeFlow()` - Run the bot flow
- `executeNode()` - Process individual flow nodes
- `handleInteractiveResponse()` - Handle button/list clicks

### 2. **bot-service.ts** - WhatsApp Message Sender

**Location:** `backend/server/bot-service.ts`

**Capabilities:**
- ✅ Send text messages
- ✅ Send button messages (up to 3 buttons)
- ✅ Send list messages (menu with sections)
- ✅ Send media (images, videos, documents)
- ✅ Send template messages
- ✅ Mark messages as read

### 3. **Webhook Endpoint** - Receive Messages

**Location:** `backend/server/routes.ts`

**Endpoints:**

```typescript
// Webhook verification (required by Meta)
GET /api/webhooks/whatsapp
// Verifies your webhook with Meta's challenge

// Receive incoming messages
POST /api/webhooks/whatsapp
// Processes all incoming WhatsApp messages
```

### 4. **Bot Management API Routes**

**Flow Management:**
- `GET /api/bot/flows` - Get all flows
- `GET /api/bot/flows/:id` - Get single flow
- `POST /api/bot/flows` - Create new flow
- `PUT /api/bot/flows/:id` - Update flow
- `DELETE /api/bot/flows/:id` - Delete flow

**Conversation Management:**
- `GET /api/bot/conversations` - Get all conversations
- `GET /api/bot/conversations/:id` - Get conversation with messages
- `POST /api/bot/conversations/:id/close` - Close conversation

**Analytics:**
- `GET /api/bot/analytics` - Get overall analytics
- `GET /api/bot/analytics/flows/:flowId` - Get flow-specific analytics

---

## 🎨 Frontend Pages

### 1. **Bot Flow Builder** (`/dashboard/bot-flow-builder`)

**Location:** `frontend/client/src/pages/bot-flow-builder.tsx`

**Features:**
- ✅ Create & edit bot flows
- ✅ Configure trigger types (keyword, welcome, button)
- ✅ Add flow nodes (message, buttons, list, condition, end)
- ✅ Set flow priority
- ✅ Activate/deactivate flows
- ✅ Visual flow overview

**Node Types Available:**
- **Message** - Send plain text
- **Buttons** - Send up to 3 clickable buttons
- **List** - Send menu with multiple options
- **Condition** - If/else logic branching
- **API Call** - Make external API requests
- **End** - Complete the conversation

### 2. **Conversations Viewer** (`/dashboard/conversations`)

**Location:** `frontend/client/src/pages/conversations.tsx`

**Features:**
- ✅ Real-time conversation list
- ✅ Auto-refresh (every 5 seconds)
- ✅ View full message history
- ✅ See conversation status (active/closed)
- ✅ Search conversations
- ✅ Close conversations manually
- ✅ Beautiful chat interface

### 3. **Bot Analytics** (`/dashboard/bot-analytics`)

**Location:** `frontend/client/src/pages/bot-analytics.tsx`

**Metrics Displayed:**
- ✅ Total conversations
- ✅ Active vs completed chats
- ✅ Total messages (inbound/outbound)
- ✅ Flow completion rates
- ✅ Recent activity timeline
- ✅ Per-flow performance

---

## 📨 How Messages Flow

### Scenario: User sends "hi" on WhatsApp

```
1. User types "hi" and sends
   ↓
2. Meta receives message
   ↓
3. Meta sends webhook to: POST /api/webhooks/whatsapp
   {
     "object": "whatsapp_business_account",
     "entry": [{
       "changes": [{
         "value": {
           "messages": [{
             "from": "919876543210",
             "type": "text",
             "text": { "body": "hi" }
           }]
         }
       }]
     }]
   }
   ↓
4. Bot Engine processes:
   - Finds/creates conversation for 919876543210
   - Detects "hi" matches "welcome" trigger
   - Loads "Welcome Flow"
   - Executes first node
   ↓
5. First node type: "message"
   - Bot sends: "👋 Welcome to Zervos! How can I help you?"
   ↓
6. Second node type: "buttons"
   - Bot sends buttons:
     [Book Appointment] [View Services] [Contact Support]
   ↓
7. User clicks [Book Appointment]
   ↓
8. Bot Engine:
   - Detects button click
   - Finds next node for that button
   - Executes booking flow...
   ↓
9. Continues until "end" node
   - Bot sends: "✅ Thank you! Your appointment is confirmed."
   - Conversation status = "closed"
```

---

## 🔧 Configuration Steps

### Step 1: Configure Meta WhatsApp Business API

1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Create/select your app
3. Add WhatsApp product
4. Get credentials:
   - **Phone Number ID**
   - **Business Account ID**
   - **Access Token** (permanent token)

### Step 2: Configure Webhook in Meta

1. In Meta Developer Portal → WhatsApp → Configuration
2. Set webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
3. Set verify token: `zervos_webhook_token_12345` (or your custom token)
4. Subscribe to webhook fields:
   - ✅ messages
   - ✅ message_status

### Step 3: Configure in Zervos

1. Navigate to **WhatsApp → WABA Config**
2. Enter your credentials
3. Click "Test Connection"
4. Click "Save Configuration"

### Step 4: Deploy Your Server

Make sure your server is accessible from the internet (Meta needs to reach your webhook).

Options:
- Deploy to production (recommended)
- Use ngrok for local testing: `ngrok http 5000`

---

## 🚀 Creating Your First Bot Flow

### Example: Simple Welcome Flow

1. **Go to Bot Flow Builder**
   - Navigate to `/dashboard/bot-flow-builder`
   - Click "New Flow"

2. **Configure Flow Settings**
   ```
   Name: Welcome Flow
   Description: Greet new users
   Trigger Type: Welcome
   Trigger Value: (leave empty - triggers on "hi", "hello", "start")
   Active: ✅ ON
   Priority: 10
   ```

3. **Add Nodes**

   **Node 1: Message**
   ```
   Type: Message
   Content: 👋 Welcome to Zervos! We're here to help you manage your business.
   ```

   **Node 2: Buttons**
   ```
   Type: Buttons
   Message: What would you like to do?
   Buttons:
     - 📅 Book Appointment
     - 📋 View Services
     - 💬 Contact Support
   ```

   **Node 3: End**
   ```
   Type: End
   Message: Thank you! Our team will get back to you shortly.
   ```

4. **Save Flow**
   - Click "Save Flow"
   - Flow is now active!

5. **Test It**
   - Send "hi" from your WhatsApp
   - Bot should respond instantly

---

## 🧪 Testing the Bot

### Test Checklist

1. **Send Welcome Message**
   - Send: "hi"
   - Expected: Welcome message + buttons

2. **Click Button**
   - Click any button
   - Expected: Next message in flow

3. **Check Conversations Page**
   - Go to `/dashboard/conversations`
   - Expected: Your conversation appears

4. **Check Analytics**
   - Go to `/dashboard/bot-analytics`
   - Expected: Flow metrics updated

---

## 📚 API Reference

### Flow Data Structure

```typescript
{
  nodes: [
    {
      id: "node_1",
      type: "message",
      data: {
        message: "Hello! Welcome to our service."
      },
      nextNodeId: "node_2"
    },
    {
      id: "node_2",
      type: "buttons",
      data: {
        message: "What would you like to do?",
        buttons: [
          {
            id: "btn_1",
            text: "Book Now",
            nextNodeId: "node_3"
          },
          {
            id: "btn_2",
            text: "Learn More",
            nextNodeId: "node_4"
          }
        ]
      }
    },
    {
      id: "node_3",
      type: "end",
      data: {
        endMessage: "Great! We'll help you book an appointment."
      }
    }
  ],
  startNodeId: "node_1"
}
```

### Interactive Message Types

#### Button Message (Max 3 buttons)
```typescript
wabaService.sendButtonMessage(
  phoneNumber,
  "What would you like to do?",
  [
    { id: "btn_1", title: "Option 1" },
    { id: "btn_2", title: "Option 2" },
    { id: "btn_3", title: "Option 3" }
  ],
  "Header Text",      // optional
  "Footer Text"       // optional
);
```

#### List Message (Menu)
```typescript
wabaService.sendListMessage(
  phoneNumber,
  "Choose a service",
  "View Services",    // Button text
  [
    {
      title: "Beauty Services",
      rows: [
        { id: "svc_1", title: "Haircut", description: "$30" },
        { id: "svc_2", title: "Facial", description: "$50" }
      ]
    },
    {
      title: "Spa Services",
      rows: [
        { id: "svc_3", title: "Massage", description: "$80" }
      ]
    }
  ]
);
```

---

## 🎯 Next Steps

### Enhancements You Can Add:

1. **AI Integration**
   - Add OpenAI for natural language understanding
   - Auto-detect user intent

2. **Advanced Conditions**
   - Branch based on time of day
   - Branch based on user history
   - Custom variables

3. **CRM Integration**
   - Auto-create leads from conversations
   - Update customer records
   - Trigger workflows

4. **Appointment Booking**
   - Integrate with calendar
   - Show available slots
   - Confirm bookings

5. **Payment Collection**
   - Send payment links
   - Track payment status

6. **Human Handoff**
   - Transfer to agent when bot can't help
   - Live chat takeover

---

## 🆘 Troubleshooting

### Webhook Not Receiving Messages

1. Check webhook verification
2. Ensure server is publicly accessible
3. Verify verify_token matches
4. Check Meta webhook subscriptions

### Bot Not Responding

1. Check flow is active
2. Verify trigger keyword matches
3. Check conversation status
4. Review bot engine logs

### Messages Not Sending

1. Verify WABA config is saved
2. Check access token validity
3. Ensure phone number is verified
4. Check Meta API rate limits

---

## 📝 Summary

You now have a **complete WhatsApp bot system** with:

✅ **Backend:** Webhook receiver, bot engine, message handlers
✅ **Frontend:** Flow builder, conversation viewer, analytics
✅ **Database:** Full schema for conversations and flows
✅ **Features:** Buttons, lists, conditions, tracking

**Your bot can:**
- Receive messages from users
- Execute multi-step conversational flows
- Send interactive messages (buttons & lists)
- Track all conversations and analytics
- Be fully managed from your dashboard

**Start creating your flows and watch your bot come to life! 🚀**
