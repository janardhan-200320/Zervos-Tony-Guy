# 🎯 Quick Reference - Enhanced Bot Flow Builder

## 🚀 Access the Builder

**URL:** http://localhost:5176/bot-flow

**Component Import:**
```tsx
import { EnhancedBotFlowBuilder } from '@/components/botflow';
```

## 🎨 Key Features at a Glance

### Visual Elements
| Element | Description | Color Scheme |
|---------|-------------|--------------|
| **Start Node** | 🎯 Entry point | Green gradient |
| **Message Nodes** | 💬 Text/Media/Template | Blue/Purple/Cyan |
| **Interaction Nodes** | 🔘 Buttons/Lists/Quick Reply | Violet/Pink/Amber |
| **Logic Nodes** | 🔀 Conditions/Loops | Orange/Lime |
| **Action Nodes** | ⚡ API/Delay/Agent/Tags | Cyan/Indigo/Violet/Emerald |
| **End Node** | 🏁 Flow termination | Red gradient |

### Connection Colors
- 🟢 **Green** = Success path
- 🔴 **Red** = Error path  
- 🟠 **Orange** = Condition branch
- 🟣 **Purple** = User interaction
- ⚪ **Gray** = Default/fallback

## ⌨️ Keyboard Shortcuts

```
Ctrl + Z          Undo last action
Ctrl + Shift + Z  Redo action
Ctrl + S          Save flow
Delete            Delete selected node
Space + Drag      Pan canvas (future)
Ctrl + Scroll     Zoom in/out (future)
```

## 🎮 Common Operations

### Add a Node
1. Click node in left palette OR
2. Drag node to canvas

### Configure a Node
1. Click edit icon (pencil) on node
2. Fill in configuration
3. See live WhatsApp preview
4. Click "Save Changes"

### Connect Nodes
1. Drag from output handle (bottom)
2. Drop on input handle (top)
3. Connection created automatically

### Delete Items
- **Node:** Click trash icon or select + press Delete
- **Connection:** Click connection → click X button

### Canvas Controls
- **Zoom In:** Click + button or zoom in toolbar
- **Zoom Out:** Click - button or zoom out toolbar
- **Fit to Screen:** Click maximize icon
- **Toggle Grid:** Click grid icon
- **Toggle Left Panel:** Click panel icon

## 📝 Node Configuration Quick Guide

### Message Node 💬
```
✓ Message text (required)
✓ Variable insertion {{variable_name}}
✓ Live WhatsApp preview
```

### Button Menu 🔘
```
✓ Button message (required)
✓ Up to 3 buttons
✓ Button text (max 20 chars each)
✓ Preview shows buttons as clickable
```

### List Menu 📋
```
✓ List message (required)
✓ Multiple sections
✓ Multiple rows per section
✓ Preview shows "View Menu" button
```

### Condition Branch 🔀
```
✓ Multiple conditions (IF/ELSE IF)
✓ Variable comparison
✓ Operators: =, !=, >, <, >=, <=
✓ Two output paths
```

### API Call 🔌
```
✓ Endpoint URL
✓ Method (GET/POST/PUT/DELETE)
✓ Headers
✓ Body/Payload
✓ Response mapping
✓ Two outputs: SUCCESS, ERROR
```

### Data Capture 📝
```
✓ Expected input type
✓ Validation rules
✓ Error message
✓ Variable to store result
✓ Two outputs: VALID, INVALID
```

### Delay ⏱️
```
✓ Delay duration (seconds)
✓ Reason/Label
```

## 🔧 Variable System

### Variable Scopes
| Scope | Icon | Color | Description |
|-------|------|-------|-------------|
| **System** | 🌐 | Blue | Read-only (user_name, phone) |
| **Session** | 🕐 | Orange | Current conversation only |
| **User** | 👤 | Purple | Persistent per user |
| **Global** | 🗄️ | Green | Shared across all users |

### Using Variables
```
In messages: {{variable_name}}
In conditions: Variable = "value"
In API calls: Map to request/response
```

## 🧪 Testing Your Flow

1. Click **"Test Flow"** button
2. Simulated WhatsApp opens
3. Interact with your bot
4. See execution logs
5. Check variable values
6. Identify issues

## 💾 Saving

- **Auto-save:** Every 30 seconds
- **Manual save:** Click "Save Flow" button
- **Visual indicator:** Spinner shows saving state
- **Undo/Redo:** 50-step history preserved

## ⚠️ Common Validation Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| "Message text required" | Empty message | Add text content |
| "At least 1 button required" | No buttons | Add button(s) |
| "Button text too long" | > 20 chars | Shorten text |
| "No conditions defined" | Empty condition | Add IF condition |
| "Invalid endpoint URL" | Bad URL format | Check URL format |
| "Unconnected node" | No connections | Connect to flow |

## 🎨 UI Panels

### Left Sidebar (Collapsible)
```
┌─────────────────────┐
│ TRIGGERS            │
│  • Welcome          │
│  • Keyword          │
│  • Webhook          │
│                     │
│ VARIABLES           │
│  • {{user_name}}    │
│  • {{phone}}        │
│  • {{custom_var}}   │
│                     │
│ NODE PALETTE        │
│  📨 Messages        │
│  🎯 Interactions    │
│  🔀 Logic & Flow    │
│  ⚡ Actions         │
└─────────────────────┘
```

### Main Canvas
```
┌───────────────────────────────┐
│ [Grid Background]             │
│                               │
│    ┌──────┐                   │
│    │START │                   │
│    └──┬───┘                   │
│       ╎ (dotted curved line)  │
│    ┌──▼────┐                  │
│    │MESSAGE│                  │
│    └───────┘                  │
│                               │
│ [Mini-map]                    │
└───────────────────────────────┘
```

### Right Panel (Conditional)
```
┌─────────────────────┐
│ Node Configuration  │
│ ═══════════════════ │
│                     │
│ [Form Fields]       │
│                     │
│ WhatsApp Preview    │
│ ┌─────────────────┐ │
│ │ 🤖 Your Bot     │ │
│ │ ─────────────── │ │
│ │ [Message]       │ │
│ │ [Buttons]       │ │
│ └─────────────────┘ │
│                     │
│ [Cancel] [Save]     │
└─────────────────────┘
```

## 🎯 Best Practices

### Flow Design
✅ Start with welcome message  
✅ Add clear call-to-action buttons  
✅ Handle errors gracefully  
✅ Always provide exit paths  
✅ Test before deploying  

### Node Organization
✅ Group related nodes  
✅ Use descriptive labels  
✅ Keep flows readable  
✅ Avoid crossing connections  
✅ Use colors for visual grouping  

### Variable Naming
✅ Use lowercase_with_underscores  
✅ Be descriptive: `user_email` not `e`  
✅ Avoid spaces and special chars  
✅ Use consistent naming conventions  

## 🐛 Troubleshooting

### Canvas not responding?
- Refresh page (F5)
- Check browser console for errors
- Try different zoom level

### Connections not showing?
- Ensure nodes are connected
- Check SVG layer rendering
- Zoom to different level

### Node disappeared?
- Use Ctrl+Z to undo
- Check if it's off-screen
- Use "Fit to Screen" button

### Performance slow?
- Reduce number of nodes visible
- Hide mini-map
- Disable grid background
- Close unused panels

## 📚 Component Reference

### Core Components
```tsx
EnhancedBotFlowBuilder   // Main container
EnhancedNodeCard         // Node visual
EnhancedConnectionLine   // Connection line
EnhancedNodePalette      // Node selector
EnhancedConfigPanel      // Configuration
LeftSidebarPanels        // Triggers + Variables
```

### Usage Example
```tsx
import { EnhancedBotFlowBuilder } from '@/components/botflow';

export default function BotFlowPage() {
  return (
    <div className="h-screen">
      <EnhancedBotFlowBuilder flowId="my-flow-123" />
    </div>
  );
}
```

## 🌟 Pro Tips

1. **Use keyboard shortcuts** for faster workflow
2. **Name your nodes** clearly for easier debugging
3. **Test frequently** during development
4. **Use variables** for personalization
5. **Add fallback paths** for errors
6. **Document complex logic** with labels
7. **Keep flows modular** for maintainability
8. **Save often** even with auto-save

## 📊 Node Limits

| Node Type | Max Outputs | Max Items | Notes |
|-----------|-------------|-----------|-------|
| START | 1 | N/A | Only one per flow |
| MESSAGE | 1 | N/A | No limits |
| BUTTONS | 3 | 3 buttons | WhatsApp limit |
| QUICK_REPLY | 10 | 10 chips | Recommended |
| LIST | Many | 10 sections | WhatsApp limit |
| CONDITION | 2+ | Many conditions | IF/ELSE branches |
| LOOP | 2 | Set limit | CONTINUE/EXIT |
| END | 0 | N/A | Terminal node |

## 🎓 Learning Path

1. **Start Simple** - Welcome message + 2 buttons
2. **Add Conditions** - Branch based on button clicks
3. **Capture Data** - Get user input
4. **API Integration** - Call external services
5. **Error Handling** - Add fallback paths
6. **Testing** - Simulate full conversation
7. **Deploy** - Save and activate

## 🏆 Success Checklist

Before deploying your flow:

- [ ] All nodes connected
- [ ] No validation errors
- [ ] All buttons have text
- [ ] Error paths handled
- [ ] Variables defined
- [ ] Flow tested end-to-end
- [ ] User journey makes sense
- [ ] Exit points exist
- [ ] API endpoints working
- [ ] Messages reviewed for typos

---

**Need help?** Check the full documentation in [README.md](./README.md)

**Server running at:** http://localhost:5176/
