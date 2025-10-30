# Quick Start

Let's catch your first email with MailCade.

## Point your app to MailCade

Tell your app to send emails to `localhost:1025`. No authentication needed.

Here's how to do it in a few frameworks:

### Laravel

In your `.env` file:

```env
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

### Node.js

With Nodemailer:

```javascript
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025
});
```

### Python

```python
import smtplib

server = smtplib.SMTP('localhost', 1025)
server.sendmail('from@example.com', 'to@example.com', 'Hello!')
server.quit()
```

### Rails

```ruby
config.action_mailer.smtp_settings = {
  address: 'localhost',
  port: 1025
}
```

## Send a test email

Now trigger an email from your app. Could be a registration email, password reset, whatever.

Or if you just want to see it work, use curl:

```bash
curl smtp://localhost:1025 \
  --mail-from test@example.com \
  --mail-rcpt you@example.com \
  --upload-file - <<EOF
Subject: Testing MailCade

If you see this, it works!
EOF
```

## Check MailCade

The email shows up instantly in MailCade. Click it to view the full content, check headers, test links - whatever you need.

That's it. You're all set.

## Dive deeper

Want to customize ports or tweak settings? Check the [configuration guide](configuration.md).

Need examples for other frameworks? See [sending emails](../usage/sending-emails.md).

Working on specific features like password resets? The [testing workflows guide](../usage/testing-workflows.md) has you covered.
