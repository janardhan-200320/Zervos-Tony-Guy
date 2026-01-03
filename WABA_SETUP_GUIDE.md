# WhatsApp Business API (WABA) Integration Guide

## What Has Been Created

### 1. **WABA Service Layer** (`waba-service.ts`)
- Meta Cloud API integration
- Template message sending
- Text message sending (within 24-hour window)
- Template management
- Connection testing
- Broadcast campaign storage

### 2. **WABA Configuration Page** (`/dashboard/waba-config`)
- Store Meta API credentials securely
- Test connection to Meta API
- Step-by-step setup guide
- Visual feedback on connection status

### 3. **Marketing Campaigns Page** (`/dashboard/marketing-campaigns`)
- Create broadcast campaigns
- Select message templates
- Target customer segments
- Send bulk messages
- Track campaign performance
- View delivery statistics

## How to Use

### Step 1: Get Your Meta WABA Credentials

1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Select your app or create a new one
3. Add WhatsApp product
4. Navigate to WhatsApp → API Setup
5. Collect the following:
   - **Phone Number ID**: From registered phone number section
   - **Business Account ID**: From WhatsApp Manager settings
   - **Access Token**: Create permanent token from System Users with `whatsapp_business_messaging` permission

### Step 2: Configure WABA in Zervos

1. Navigate to **WhatsApp → WABA Config** in sidebar
2. Enter your credentials:
   - Phone Number ID
   - Business Account ID
   - Access Token
   - API Version (default: v18.0)
3. Click "Test Connection" to verify
4. Click "Save Configuration"

### Step 3: Create Message Templates in Meta

Before sending campaigns, you need Meta-approved templates:

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Navigate to Account Tools → Message Templates
3. Create templates for:
   - **MARKETING**: Promotions, offers, announcements
   - **UTILITY**: Order updates, appointment reminders
   - **AUTHENTICATION**: OTP, verification codes

**Template Example:**
```
Name: weekend_sale
Category: MARKETING
Language: English

Message:
🎉 *{{1}}* - Weekend Sale!

Get {{2}} discount on all services this weekend!

Book now: {{3}}

Valid till {{4}}
```

### Step 4: Create and Send Campaigns

1. Navigate to **WhatsApp → Marketing Campaigns**
2. Click "Create Campaign"
3. Fill in:
   - Campaign name
   - Select approved template
   - Choose target audience (All customers, Active customers, or Custom numbers)
4. Click "Create Campaign"
5. Click "Send Now" to start sending

## Features

### ✅ What You Can Do

- **Broadcast Messages**: Send promotional offers to multiple customers
- **Template Messages**: Use Meta-approved templates for marketing
- **Customer Segmentation**: Target specific groups
- **Campaign Analytics**: Track sent, delivered, failed messages
- **Bulk Sending**: Send to unlimited customers (within Meta limits)
- **Compliance**: All messages follow Meta's WhatsApp Business Policy

### ⚠️ Limitations & Best Practices

1. **24-Hour Window**: Can only send template messages to users who haven't messaged you in 24 hours
2. **Message Limits**: 
   - Start tier: 1,000 unique recipients/day
   - Grows based on quality and volume
3. **Template Approval**: All marketing templates must be pre-approved by Meta (takes 1-24 hours)
4. **Rate Limits**: 
   - 80 messages/second for most businesses
   - 1,000 messages/second for verified businesses

### 📊 Pricing (Meta Cloud API)

- **Free Tier**: 1,000 conversations/month
- **Paid**: ₹0.40-0.60 per conversation after free tier
- **Conversation**: 24-hour messaging window with a customer

## Dual WhatsApp Strategy

### WAHA (Current Setup) - For Transactional
- ✅ Appointment confirmations
- ✅ Invoice/receipt delivery
- ✅ Order status updates
- ✅ Quick customer responses
- ✅ Instant messaging (no template approval needed)

### WABA (New Setup) - For Marketing
- ✅ Promotional campaigns
- ✅ Discount offers
- ✅ Seasonal sales
- ✅ Customer re-engagement
- ✅ Bulk announcements
- ✅ Meta-verified delivery

## Common Issues & Solutions

### Issue: "Failed to connect to Meta API"
**Solution**: 
- Verify Access Token has `whatsapp_business_messaging` permission
- Check if token is permanent (not temporary)
- Ensure Business Account ID is correct

### Issue: "No templates found"
**Solution**:
- Create templates in Meta Business Suite
- Wait for template approval (1-24 hours)
- Ensure templates are in "APPROVED" status

### Issue: "Message sending failed"
**Solution**:
- Check if template is approved
- Verify phone number format (include country code)
- Ensure customer hasn't blocked your business number
- Check if you're within rate limits

## Next Steps

1. **Create Your First Template**: Design marketing templates in Meta Business Suite
2. **Test Small Campaign**: Send to 10-20 customers first
3. **Monitor Performance**: Check delivery rates and engagement
4. **Scale Gradually**: Increase volume as quality metrics improve
5. **Automate Campaigns**: Schedule recurring campaigns for regular promotions

## Support

For issues or questions:
- Check Meta's [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- Review [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- Contact Meta Business Support for API issues

---

**Note**: This integration is production-ready and follows Meta's best practices for WhatsApp Business API integration.
