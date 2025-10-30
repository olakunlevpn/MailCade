# Building from Source

**MailCade is not available for building from source at this time.**

We only provide pre-built releases for end users. Building from source is reserved for internal development by the core team.

## Download Pre-Built Releases

Instead of building from source, please download the latest pre-built release for your platform:

**Download from**: [GitHub Releases](https://github.com/olakunlevpn/MailCade/releases)

Available platforms:
- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer
- **Linux**: `.AppImage`, `.deb`, or `.rpm`

## Why Not Open Source Builds?

MailCade is in active development and we're establishing a solid foundation before opening up the build process. This ensures:

- Consistent quality across all platforms
- Proper testing and validation
- Secure distribution channels
- Reliable auto-updates

## Technology Stack

For transparency, here's what powers MailCade:

### Frontend
- **Vue 3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Pinia** - State management

### Backend
- **Electron** - Desktop framework
- **Mailpit** - Email testing server
- **electron-store** - Settings persistence
- **electron-updater** - Auto-updates

## Future Plans

We plan to open source the build process in the future. When that happens, this documentation will be updated with complete build instructions.

To stay informed:
- Watch the repository on GitHub
- Star the project for updates
- Follow release announcements

## Get Help

If you have questions or need assistance:

- Check the [Installation Guide](../getting-started/installation.md)
- Read the [Troubleshooting Guide](../advanced/troubleshooting.md)
- Report issues on [GitHub](https://github.com/olakunlevpn/MailCade/issues)

## What's Next?

- [Contributing](contributing.md) - How to help (bug reports, feature requests)
- [Release Process](releasing.md) - How releases are created
