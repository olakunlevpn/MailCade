# Configuration

MailCade works fine with the defaults, but here's how to tweak things if you need to.

## Changing ports

By default, MailCade listens on port 1025. If something else is using that port, you can change it.

Go to Settings → Server Configuration → SMTP Port. Pick any port between 1 and 65535. Click Restart Server.

Your app will need to send to the new port too:

```env
MAIL_PORT=1026  # or whatever you chose
```

There's also an API port (default 8025) but you probably won't need to touch it.

## Email retention

MailCade keeps up to 500 emails by default. When you hit the limit, older emails get deleted automatically.

You can change this in Settings → Server Configuration → Email Retention. Set it anywhere from 10 to 10,000 emails.

## Other settings

### Auto-start

By default, the email server starts when you launch MailCade. You probably want to keep this on so you don't forget.

Find it in Settings → General → Auto-start Server.

### Notifications

MailCade can notify you when emails arrive. Handy if you're testing something in the background.

Toggle it in Settings → General → Desktop Notifications.

### Theme

Pick Light, Dark, or System (follows your OS). Settings → General → Theme.

## Testing multiple projects

If you're working on several apps at once, you have two options:

**Use different ports:** Run Project A on 1025, Project B on 1026, etc. Just change the SMTP port in MailCade when switching between projects.

**Use the same port:** Point all projects to 1025. All emails show up in one inbox. Works fine if you can tell them apart by subject or sender.

## What's next

Need examples for more frameworks? Check out [sending emails](../usage/sending-emails.md).

Want to dive deep into every setting? See the [complete settings guide](../advanced/settings.md).
