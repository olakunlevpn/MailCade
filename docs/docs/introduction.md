# Introduction

MailCade catches all emails your app tries to send. Think of it as a local email inbox for developers.

![MailCade Screenshot](/images/cover.png)

Instead of emails actually being sent, they show up in MailCade. You can inspect them, click links, check how they look - all without spamming real inboxes or setting up external email services.

## Quick look

Here's what a typical workflow looks like:

```env
# Point your app to MailCade
MAIL_HOST=localhost
MAIL_PORT=1025
```

Send an email from your app, and boom - it appears in MailCade instantly.

## Why you'll love it

MailCade runs completely local. No cloud services, no external dependencies, no privacy concerns. It's just you and your test emails.

The app works out of the box - no config files to edit, no services to install. Launch it and you're ready to test.

It's fast too. Emails appear instantly, and the app uses barely any resources even with thousands of emails.

## Perfect for testing

MailCade shines when you're working on:

- Registration flows with verification emails
- Password reset workflows
- Order confirmations and receipts
- Email template design
- Any feature that sends emails

You can test everything locally without worrying about accidentally emailing real users or setting up complicated test infrastructure.

## What it isn't

MailCade isn't a production email server. Emails never actually leave your machine - they just get caught by MailCade so you can inspect them.

It also doesn't fetch emails from real mail servers. It only catches emails your local apps try to send.

## Under the hood

MailCade wraps [Mailpit](https://mailpit.axllent.org/) in a native desktop app. This means you get all of Mailpit's power with a cleaner interface and automatic updates.

## Getting started

Head over to the [installation guide](getting-started/installation.md) to download MailCade. Then check out the [quick start](getting-started/quickstart.md) to send your first test email.

If you run into issues, the [troubleshooting guide](advanced/troubleshooting.md) has solutions for common problems.

## Questions or issues?

Found a bug? Have a feature idea? [Open an issue on GitHub](https://github.com/olakunlevpn/MailCade/issues).

Want to see what's new? Check the [releases page](https://github.com/olakunlevpn/MailCade/releases).
