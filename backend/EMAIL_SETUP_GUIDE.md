# Welcome Email System Setup Guide

## Overview
Go-Shop Ghana now has an automated welcome email system that sends a personalized email to every new user upon signup.

## Email Features

### Welcome Email Content:
- **Personalized greeting** with user's name
- **Thank you message** for signing up
- **Special offer**: FREE delivery on first TWO orders
- **Quality promise**: Quality products at affordable prices
- **Mobile app announcement**: Coming soon notification
- **Feedback contact**: Phone number 0241293754
- **Professional design**: Branded with Go-Shop Ghana colors (#FED141, #303A4D)

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

1. **Create or use existing Gmail account**
   - Go to https://gmail.com
   - Create account or use existing one

2. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

3. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Go-Shop Ghana"
   - Copy the 16-character password

4. **Update .env file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App password from step 3
   EMAILS_FROM_EMAIL=your-email@gmail.com
   EMAILS_FROM_NAME=Go-Shop Ghana
   ```

### Option 2: Free Email Services

#### Brevo (formerly Sendinblue) - FREE 300 emails/day
1. Sign up at https://www.brevo.com
2. Get SMTP credentials from Settings > SMTP & API
3. Update .env:
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-brevo-email
   SMTP_PASSWORD=your-brevo-smtp-key
   EMAILS_FROM_EMAIL=your-verified-email@domain.com
   ```

#### SendGrid - FREE 100 emails/day
1. Sign up at https://sendgrid.com
2. Create API key
3. Update .env:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your-sendgrid-api-key
   EMAILS_FROM_EMAIL=your-verified-email@domain.com
   ```

#### Mailgun - FREE 5,000 emails/month (first 3 months)
1. Sign up at https://www.mailgun.com
2. Get SMTP credentials
3. Update .env:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASSWORD=your-mailgun-password
   EMAILS_FROM_EMAIL=noreply@your-domain.com
   ```

## Testing the Email System

### 1. Restart Backend Server
```bash
cd backend
# Stop current server (Ctrl+C)
# Start again
uvicorn app.main:app --reload
```

### 2. Test Signup
```bash
# Using curl
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "user_type": "buyer",
    "location": "Greater Accra"
  }'
```

### 3. Check Email
- Check the inbox of the email you used for signup
- Look for email from "Go-Shop Ghana"
- Check spam folder if not in inbox

## Email Template Customization

The email template is in `backend/app/core/email.py` in the `send_welcome_email()` function.

### Customizable Elements:
- **Colors**: Change `#FED141`, `#303A4D`, `#4698CA`, `#93C90F`
- **Phone number**: Currently set to `0241293754`
- **Free delivery offer**: Currently "first TWO orders"
- **Shop URL**: Currently `http://localhost:3000/shop`
- **Company info**: Footer section

## Troubleshooting

### Email not sending?
1. **Check logs**: Look for error messages in terminal
2. **Verify credentials**: Ensure SMTP_USER and SMTP_PASSWORD are correct
3. **Check .env file**: Make sure no extra spaces or quotes
4. **Gmail users**: Must use App Password, not regular password
5. **Firewall**: Ensure port 587 is not blocked

### Email goes to spam?
1. **Use verified domain**: Free email services require domain verification
2. **SPF/DKIM records**: Set up for your domain
3. **Sender reputation**: Use consistent "from" address

### Email not personalized?
- The system uses `full_name` if available, otherwise `username`
- Check user model has these fields

## Production Recommendations

1. **Use professional email service**: Brevo, SendGrid, or Mailgun
2. **Verify domain**: Add SPF, DKIM, DMARC records
3. **Monitor delivery**: Check bounce rates and spam complaints
4. **Use queue system**: For high volume, use Celery or similar
5. **Add unsubscribe link**: For marketing compliance
6. **Track opens/clicks**: Use email service analytics

## Email Service Comparison

| Service | Free Tier | Best For |
|---------|-----------|----------|
| Gmail | ~500/day | Testing only |
| Brevo | 300/day | Small business |
| SendGrid | 100/day | Developers |
| Mailgun | 5,000/month (3 months) | Growing apps |
| Amazon SES | 62,000/month | AWS users |

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` file with real credentials to Git
- Use App Passwords for Gmail, not your main password
- Rotate credentials regularly
- Use environment variables in production
- Enable 2FA on email service accounts

## Support

If you encounter issues:
1. Check backend logs for error messages
2. Verify email service status
3. Test SMTP connection with telnet
4. Contact email service support

## Next Steps

Consider adding:
- Order confirmation emails
- Shipping notification emails
- Password reset emails
- Promotional emails
- Newsletter system
