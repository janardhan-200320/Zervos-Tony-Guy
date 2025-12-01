# 🚀 Workflow Automation - Quick Start Guide

## 5-Minute Setup

### Step 1: Access Workflows (30 seconds)
1. Open your Zervos dashboard
2. Click **"Workflows"** in the sidebar
3. Select your workspace from **"My Space"** dropdown

### Step 2: Choose a Template (1 minute)
1. Click **"Browse Templates"** button (top right)
2. Explore categories:
   - **Booking** - Confirmations, cancellations
   - **Customer** - Welcome, birthdays, win-backs
   - **Reminders** - 24h, 2h, complete sequences
   - **Reports** - Daily summaries
   - **Staff** - Schedule reminders
3. Click **"Use Template"** on any template

### Step 3: Customize (2 minutes)
1. Click **Edit** on your new workflow
2. Go to **Visual Builder** tab - See your workflow flow
3. Click **Edit** on any action node to modify:
   - Change email subject
   - Update message content
   - Add template variables from dropdown
4. Click **Save Action**

### Step 4: Test (1 minute)
1. Click **"Test Run"** button
2. Fill in sample customer data
3. Click **"Run Test"**
4. Check **Logs** tab to see results

### Step 5: Activate (30 seconds)
1. Go to **Settings** tab
2. Toggle **Active Status** to ON
3. Click **"Save Changes"**
4. Done! Your workflow is live! 🎉

---

## Most Popular Templates

### 1. **Booking Confirmation Flow** ⭐⭐⭐⭐⭐
**Use when:** New booking created  
**Sends:** Email + SMS confirmation  
**Result:** Customer confidence, fewer no-shows

### 2. **Complete Reminder Sequence** ⭐⭐⭐⭐⭐
**Use when:** Appointment scheduled  
**Sends:** 
- 24h before: Email + SMS
- 2h before: SMS + WhatsApp
**Result:** 60% reduction in no-shows

### 3. **Win-back Inactive Customers** ⭐⭐⭐⭐
**Use when:** Customer inactive 60+ days  
**Sends:** Special offer email + follow-up SMS  
**Result:** Recover 25-30% of churned customers

### 4. **Birthday Special Offer** ⭐⭐⭐⭐⭐
**Use when:** Customer birthday  
**Sends:** Birthday wishes + 20% discount  
**Result:** Increased bookings, customer delight

### 5. **Review Collection Flow** ⭐⭐⭐⭐
**Use when:** Appointment completed  
**Sends:** Review request after 2 hours + follow-up  
**Result:** More reviews, better reputation

---

## Template Variables Cheat Sheet

### Most Used Variables

#### Customer Info
```
{{customer.name}}          - Full name
{{customer.firstName}}     - First name only
{{customer.email}}         - Email address
{{customer.phone}}         - Phone number
```

#### Booking Details
```
{{booking.date}}          - Appointment date
{{booking.time}}          - Appointment time
{{booking.status}}        - Current status
{{booking.confirmationCode}} - Unique code
```

#### Service Info
```
{{service.name}}          - Service name
{{service.price}}         - Service price
{{service.duration}}      - Duration
{{service.category}}      - Category
```

#### Organization
```
{{organization.name}}     - Your business name
{{organization.phone}}    - Contact number
{{organization.address}}  - Location
{{organization.email}}    - Contact email
```

### How to Use Variables
1. In email/SMS editor, click the **Tag** icon
2. Browse variable categories
3. Click any variable to insert
4. Example: "Hi {{customer.firstName}}, your {{service.name}} is confirmed!"

---

## Common Workflows

### Welcome New Customer
```
TRIGGER: Customer Created
↓
ACTION 1: Send welcome email (with discount code)
↓
ACTION 2: Send welcome SMS
↓
ACTION 3: Add tag "new_customer"
```

### Appointment Reminder
```
TRIGGER: 24 hours before booking
↓
ACTION 1: Send email reminder
↓
ACTION 2: Send SMS reminder
↓
WAIT: 22 hours
↓
ACTION 3: Send 2h SMS reminder
↓
ACTION 4: Send WhatsApp reminder
```

### Post-Appointment Follow-up
```
TRIGGER: Booking completed
↓
WAIT: 2 hours
↓
ACTION 1: Send thank you email
↓
ACTION 2: Request review
↓
WAIT: 3 days
↓
ACTION 3: Send review reminder SMS
```

---

## Tips & Tricks

### ✅ Best Practices
- **Start with templates** - Don't build from scratch
- **Test before activating** - Always run test first
- **Use customer names** - Personalization increases engagement by 50%
- **Keep messages short** - SMS under 160 characters
- **Add delays** - Don't overwhelm customers
- **Monitor analytics** - Check success rates weekly

### ⚠️ Common Mistakes
- ❌ Forgetting to activate workflow
- ❌ No test run before going live
- ❌ Using {{variables}} without double braces
- ❌ Too many reminders (annoys customers)
- ❌ No personalization (generic messages)
- ❌ Ignoring analytics (can't improve)

### 💡 Pro Tips
- **Timing matters** - Send reminders in the morning (8-10 AM)
- **Use emojis** - Makes SMS more engaging 😊
- **A/B test** - Try different message variations
- **Segment customers** - VIP vs. new customers
- **Update templates** - Seasonal greetings, special occasions
- **Check mobile view** - Most customers read on phones

---

## Troubleshooting

### "Workflow not sending emails"
✅ Check workflow is **Active** (Settings tab)  
✅ Verify trigger is set correctly  
✅ Check email template has {{customer.email}}  
✅ Review logs for error messages  

### "Variables not working"
✅ Use double braces: `{{variable}}` not `{variable}`  
✅ Check spelling exactly matches variable name  
✅ Ensure customer data exists (test with real booking)  

### "No analytics showing"
✅ Wait for workflow to execute at least once  
✅ Check workflow has run (Logs tab)  
✅ Refresh page after execution  

### "Can't see templates"
✅ Select workspace first (My Space dropdown)  
✅ Click "Browse Templates" button  
✅ Check you have permissions  

---

## Analytics Interpretation

### Success Rate
- **95-100%** - Excellent! Keep it up
- **90-94%** - Good, minor issues
- **80-89%** - Needs attention
- **<80%** - Check error logs immediately

### Conversion Rate
- **>60%** - Outstanding workflow effectiveness
- **40-60%** - Good performance
- **20-40%** - Needs optimization
- **<20%** - Review message content and timing

### Action Performance
- **Email success** - Should be >98%
- **SMS success** - Should be >95%
- **Webhook success** - Should be >90%

---

## Need Help?

### Quick Checks
1. Is workflow **Active**? (Settings → Active Status)
2. Did you **Save Changes**? (Bottom right button)
3. Is trigger configured? (Check trigger type)
4. Test run successful? (Use "Test Run" button)

### Still Stuck?
- Review the full documentation: `WORKFLOW_FEATURES.md`
- Check example workflows included
- Review Analytics tab for insights
- Check Logs tab for error messages

---

## Next Steps

### After Setup
1. ✅ Set up 3-5 essential workflows
2. ✅ Activate and monitor for 1 week
3. ✅ Review analytics
4. ✅ Adjust based on performance
5. ✅ Add more workflows gradually

### Advanced Features
- **Conditional Logic** - Different paths based on customer data
- **Customer Journey** - Multi-stage automation
- **A/B Testing** - Compare message variations
- **Integration** - Connect with CRM, payment systems

---

## Success Checklist

After following this guide, you should have:
- [ ] At least 3 active workflows
- [ ] Tested each workflow with sample data
- [ ] Customized messages with your branding
- [ ] Added template variables for personalization
- [ ] Enabled at least one reminder sequence
- [ ] Set up birthday/welcome automation
- [ ] Checked analytics dashboard
- [ ] Reviewed execution logs

**Congratulations! You're now automating your business! 🎉**

---

*For detailed documentation, see `WORKFLOW_FEATURES.md`*
