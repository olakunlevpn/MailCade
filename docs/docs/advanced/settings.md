# Settings

Complete guide to all MailCade settings.

## General Settings

### Auto-start Server

**Location**: Settings → General → Auto-start Server

Start the email server when MailCade launches.

**Default**: Enabled  
**Recommendation**: Keep ON so you don't forget

### Start Minimized

**Location**: Settings → General → Start Minimized

Launch MailCade minimized to system tray.

**Default**: Disabled  
**Use case**: Auto-launch on system startup

### Close to Tray

**Location**: Settings → General → Close to Tray

Keep MailCade running in tray when window is closed.

**Default**: Disabled  
**Use case**: Keep catching emails in background

### Desktop Notifications

**Location**: Settings → General → Desktop Notifications

Show system notifications when new emails arrive.

**Default**: Enabled  
**Requirements**: Grant notification permission when prompted

### Theme

**Location**: Settings → General → Theme

**Options**:
- **Light** - Bright theme
- **Dark** - Dark theme
- **System** - Follow OS preference

Switches automatically if set to System.

## Server Configuration

### SMTP Port

**Location**: Settings → Server Configuration → SMTP Port

Port where your applications send emails.

**Default**: 1025  
**Range**: 1-65535  
**Requires**: Server restart

**Common ports**:
- 1025 (recommended for development)
- 2525 (alternative)
- 587 (standard SMTP submission)
- 25 (avoid - often blocked)

### API Port

**Location**: Settings → Server Configuration → API Port

Internal port for web UI communication.

**Default**: 8025  
**Range**: 1-65535  
**Requires**: Server restart

Most users never need to change this.

### Email Retention

**Location**: Settings → Server Configuration → Email Retention

Maximum number of emails to keep.

**Default**: 500  
**Range**: 10-10,000

When limit is reached, oldest emails are auto-deleted.

**Recommendations**:
- **Light testing**: 100-200
- **Normal use**: 500
- **Heavy testing**: 1000-2000
- **Performance testing**: 5000+

### Hostname

**Location**: Settings → Server Configuration → Hostname

SMTP server hostname.

**Default**: localhost  
**Use case**: Accept connections from other machines (advanced)

## Auto-Update Settings

### Check for Updates

**Location**: Settings → Updates → Check for Updates

Manually check for new versions.

### Auto-Update

**Location**: Settings → General → Auto-update

Automatically check and notify about updates.

**Default**: Enabled  
**Recommendation**: Keep ON for security and features

### Update Channel

**Options**:
- **Stable** - Production releases only
- **Beta** - Early access to new features

## Server Controls

Quick access via sidebar gear icon ⚙️:

### Start Server

Starts the SMTP server on configured port.

### Stop Server

Stops the SMTP server. No emails will be captured.

### Restart Server

Stops and starts the server. Required after:
- Changing SMTP port
- Changing API port
- Some configuration changes

**Note**: Restart doesn't delete emails.

## Data Management

### Clear All Emails

**Methods**:

1. **Via retention limit**:
   - Set Email Retention to 10
   - Wait for auto-deletion
   - Reset to desired value

2. **Via API**:
   ```bash
   curl -X DELETE http://localhost:8025/api/v1/messages
   ```

3. **Restart server** (doesn't clear by default)

### Export Settings

Settings are stored in:
- **macOS**: `~/Library/Application Support/MailCade/`
- **Windows**: `%APPDATA%\MailCade\`
- **Linux**: `~/.config/MailCade/`

## Keyboard Shortcuts

- **Cmd/Ctrl + ,** - Open Settings
- **Cmd/Ctrl + R** - Refresh inbox
- **Cmd/Ctrl + N** - New window
- **Cmd/Ctrl + W** - Close window
- **Cmd/Ctrl + Q** - Quit MailCade

## What's Next?

- [Auto-Updates](auto-updates.md) - Keep MailCade updated
- [Troubleshooting](troubleshooting.md) - Fix common issues
