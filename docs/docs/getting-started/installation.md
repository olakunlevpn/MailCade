# Installation

Getting MailCade on your machine takes about two minutes.

## Download

Grab the latest version from the [releases page](https://github.com/olakunlevpn/MailCade/releases):

- **macOS**: Download the `.dmg` file
- **Windows**: Download the `.exe` installer
- **Linux**: Download `.AppImage`, `.deb`, or `.rpm`

MailCade works on macOS 11+, Windows 10+, and most modern Linux distros.

## Installing

### On macOS

Open the `.dmg` file and drag MailCade to your Applications folder. That's it.

**If you see a "damaged" error:**

macOS might say "MailCade is damaged and can't be opened." The app isn't damaged - it just isn't code-signed yet.

Fix it by running this command before opening the DMG:

```bash
xattr -cr ~/Downloads/MailCade-*.dmg
```

Then open the DMG and install normally.

**Alternative fix:**

If you already installed it, go to System Settings → Privacy & Security, scroll down, and click "Open Anyway" next to the MailCade warning.

### On Windows

Run the installer and follow the prompts. If Windows SmartScreen pops up, click "More info" then "Run anyway".

### On Linux

For AppImage:

```bash
chmod +x MailCade-*.AppImage
./MailCade-*.AppImage
```

For Debian/Ubuntu:

```bash
sudo dpkg -i MailCade-*.deb
```

For Fedora/RHEL:

```bash
sudo rpm -i MailCade-*.rpm
```

## First launch

When you first open MailCade, the SMTP server starts automatically on port 1025. Your inbox will be empty (obviously), and you're ready to catch emails.

No setup required. No config files to edit. Just launch and go.

## Next steps

Head to the [quick start guide](quickstart.md) to send your first test email. Takes about 30 seconds.

If you need to change ports or tweak settings, check out the [configuration guide](configuration.md).
