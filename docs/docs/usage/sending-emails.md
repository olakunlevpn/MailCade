# Sending Emails

Here's how to connect different frameworks and languages to MailCade.

The key thing: point your app to `localhost:1025`. No authentication, no encryption.

## Laravel

Add this to your `.env` file:

```env
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

Now send an email like normal:

```php
Mail::to('user@example.com')->send(new WelcomeEmail());
```

It'll show up in MailCade instead of actually sending.

## Node.js

With Nodemailer:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025
});

transporter.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<p>Hello from Node!</p>'
});
```

## Python

Using smtplib:

```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText('<p>Hello from Python!</p>', 'html')
msg['Subject'] = 'Test Email'
msg['From'] = 'sender@example.com'
msg['To'] = 'recipient@example.com'

server = smtplib.SMTP('localhost', 1025)
server.send_message(msg)
server.quit()
```

In Django, update your `settings.py`:

```python
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
```

Then send emails normally:

```python
from django.core.mail import send_mail

send_mail(
    'Test Subject',
    'Test message.',
    'from@example.com',
    ['to@example.com'],
)
```

## Ruby on Rails

In `config/environments/development.rb`:

```ruby
config.action_mailer.smtp_settings = {
  address: 'localhost',
  port: 1025
}
```

Then send emails as usual:

```ruby
UserMailer.welcome_email(@user).deliver_now
```

## PHP

```php
ini_set('SMTP', 'localhost');
ini_set('smtp_port', 1025);

mail(
    'recipient@example.com',
    'Test Email',
    'Hello from PHP!',
    'From: sender@example.com'
);
```

## Go

```go
package main

import "net/smtp"

func main() {
    from := "sender@example.com"
    to := []string{"recipient@example.com"}
    msg := []byte("Subject: Test\r\n\r\nHello from Go!")
    
    smtp.SendMail("localhost:1025", nil, from, to, msg)
}
```

## Java

With JavaMail:

```java
Properties props = new Properties();
props.put("mail.smtp.host", "localhost");
props.put("mail.smtp.port", "1025");

Session session = Session.getInstance(props);
Message message = new MimeMessage(session);
message.setFrom(new InternetAddress("sender@example.com"));
message.setRecipients(Message.RecipientType.TO,
    InternetAddress.parse("recipient@example.com"));
message.setSubject("Test Email");
message.setText("Hello from Java!");

Transport.send(message);
```

## Quick test with cURL

Want to test without writing code? Use curl:

```bash
curl smtp://localhost:1025 \
  --mail-from test@example.com \
  --mail-rcpt you@example.com \
  --upload-file - <<EOF
Subject: Test from cURL

If you see this, it works!
EOF
```

## From Docker containers

If your app runs in Docker, `localhost` won't work. Use `host.docker.internal` instead:

```yaml
# docker-compose.yml
environment:
  MAIL_HOST: host.docker.internal
  MAIL_PORT: 1025
```

On Linux, add this too:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

## Troubleshooting

Emails not showing up? Check these:

- Make sure MailCade is running (sidebar shows "● Running")
- Double-check you're using `localhost:1025`
- Turn off TLS/SSL in your app config
- Turn off SMTP authentication
- Try the curl command above to isolate the issue

Still stuck? The [troubleshooting guide](../advanced/troubleshooting.md) has more solutions.

## What's next

Now that emails are flowing in, learn how to [inspect them](viewing-emails.md) or check out [testing workflows](testing-workflows.md) for specific scenarios like password resets.
