# MailCade

**Developer Mail Sandbox - Email testing made easy**

MailCade catches all emails your app tries to send during development. No more spamming real inboxes or setting up external email services.

![MailCade](/cover.png)

## Download

Grab the latest version for your platform:

**[Download from Releases →](https://github.com/olakunlevpn/MailCade/releases)**

- **macOS**: Download the `.dmg` file
- **Windows**: Download the `.exe` installer
- **Linux**: Download `.AppImage`, `.deb`, or `.rpm`

## What it does

- 📧 **Catches all emails** - Every email your app sends shows up instantly
- 🚀 **Local SMTP server** - Runs on `localhost:1025`, no config needed
- 🎨 **Clean interface** - Modern UI with dark mode
- 🔒 **Fully local** - No cloud services, complete privacy
- ⚡ **Lightweight** - Uses barely any resources
- 🌐 **Cross-platform** - macOS, Windows, and Linux

## Quick start

1. Launch MailCade
2. Point your app to `localhost:1025`
3. Send emails - they appear instantly

That's it!

## Documentation

Need help? Check the docs:

- **[Introduction](docs/docs/introduction.md)** - What MailCade is and why you'll love it
- **[Installation](docs/docs/getting-started/installation.md)** - How to install on your system
- **[Quick Start](docs/docs/getting-started/quickstart.md)** - Get up and running in 30 seconds
- **[Full Documentation](docs/docs/toc.md)** - Everything you need to know

## Framework examples

**Laravel:**
```env
MAIL_HOST=localhost
MAIL_PORT=1025
```

**Node.js:**
```javascript
nodemailer.createTransport({
  host: 'localhost',
  port: 1025
});
```

**Django:**
```python
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
```

More examples in the [docs](docs/docs/usage/sending-emails.md).

## Support

Need help or found a bug?

- **[Report issues](https://github.com/olakunlevpn/MailCade/issues)** - Bug reports and feature requests
- **[Documentation](docs/docs/introduction.md)** - Guides and tutorials
- **[Troubleshooting](docs/docs/advanced/troubleshooting.md)** - Fix common problems

## Contributing

We're not accepting code contributions at this time. But you can help by:

- Reporting bugs and issues
- Suggesting features and improvements
- Sharing MailCade with other developers
- Starring the repository ⭐

## License

MIT License

---

**Built with ❤️ for developers who test emails**
