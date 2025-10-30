# Troubleshooting

Solutions to common MailCade issues.

## Server Won't Start

### Port Already in Use

**Symptoms**: Server shows "Stopped", error about port in use

**Check what's using the port**:

```bash
# macOS/Linux
lsof -i :1025

# Windows
netstat -ano | findstr :1025
```

**Solutions**:
1. Kill the process using the port
2. Or change MailCade's SMTP port:
   - Settings → Server Configuration
   - Change SMTP Port to `1026` or another
   - Click Restart Server

### Permission Denied

**Symptoms**: Server fails with permission error

**Cause**: Ports below 1024 require admin/root

**Solution**: Use port 1025 or higher (recommended anyway)

## Emails Not Appearing

### Server Not Running

Check sidebar:
```
Email Server ● Running  ✅
```

If stopped:
1. Click gear icon ⚙️
2. Click Start Server

### Wrong Configuration

Verify your app sends to:
```
Host: localhost (or 127.0.0.1)
Port: 1025
```

**Common mistakes**:
- TLS/SSL enabled (should be disabled)
- Authentication enabled (should be none)
- Wrong port number
- Wrong host

### Test with cURL

Isolate the issue:

```bash
curl -v smtp://localhost:1025 \
  --mail-from test@example.com \
  --mail-rcpt user@example.com \
  --upload-file - <<EOF
Subject: Test

If you see this, MailCade works!
EOF
```

If this works but your app doesn't, the problem is in your app's configuration.

## WebSocket Issues

### Real-time Updates Not Working

**Symptoms**: Need to refresh to see new emails

**Causes**:
- WebSocket connection failed
- Firewall blocking WebSocket
- API port mismatch

**Solutions**:
1. Restart MailCade
2. Check API port is accessible:
   ```bash
   curl http://localhost:8025/api/v1/messages
   ```
3. Check firewall settings

## Performance Issues

### Slow Inbox

**Cause**: Too many emails

**Solution**:
1. Settings → Server Configuration
2. Lower Email Retention to `100-200`
3. Old emails auto-delete
4. Inbox speeds up

### High CPU/Memory

**Cause**: Rapidly sending thousands of emails

**Solutions**:
- Slow down email sending rate
- Lower email retention
- Restart MailCade periodically
- Close and reopen app

## Installation Issues

### macOS: "App is Damaged"

**Error**: "MailCade is damaged and can't be opened"

**Solution**:
```bash
xattr -cr /Applications/MailCade.app
```

Then try launching again.

### macOS: Security Warning

**Error**: "Can't open because from unidentified developer"

**Solution**:
1. System Settings → Privacy & Security
2. Scroll to "MailCade was blocked"
3. Click "Open Anyway"
4. Launch MailCade again

### Windows: SmartScreen Warning

**Solution**:
1. Click "More info"
2. Click "Run anyway"

(App isn't code-signed yet, hence the warning)

### Linux: AppImage Won't Run

**Make it executable**:
```bash
chmod +x MailCade-*.AppImage
./MailCade-*.AppImage
```

**FUSE errors**:
```bash
./MailCade-*.AppImage --appimage-extract
./squashfs-root/mailcade
```

## UI Issues

### Dark Mode Not Working

1. Check system dark mode is enabled
2. Restart MailCade
3. Or manually set: Settings → General → Theme → Dark

### Window Too Small/Large

Resize window to preferred size. Size is saved automatically.

To reset:
1. Quit MailCade
2. Relaunch
3. Resize as needed

### Text Cut Off

**Try**:
- Zoom reset: `Cmd/Ctrl + 0`
- Restart MailCade
- Update to latest version

## Update Issues

### Update Check Fails

**Symptoms**: "Failed to check for updates"

**Causes**:
- No internet
- GitHub API rate limit
- Firewall

**Solutions**:
- Check internet connection
- Wait and try again
- Manually download from releases page

### Update Won't Install

1. Quit MailCade completely
2. Download new version manually
3. Install over old version
4. Launch

## Docker/Container Issues

### Can't Connect from Docker

Your app in Docker can't use `localhost`. Use:

**macOS/Windows**:
```yaml
environment:
  MAIL_HOST: host.docker.internal
```

**Linux**:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
environment:
  MAIL_HOST: host.docker.internal
```

## Platform-Specific

### macOS: Icon Missing in Dock

```bash
killall Dock
```

### Windows: Tray Icon Missing

Settings → Personalization → Taskbar → Ensure MailCade is allowed

### Linux: Font Rendering Issues

```bash
# Ubuntu/Debian
sudo apt install fonts-liberation

# Fedora
sudo dnf install liberation-fonts
```

Then restart MailCade.

## Getting Logs

Logs help diagnose issues:

**macOS**:
```bash
~/Library/Logs/MailCade/
```

**Windows**:
```
%APPDATA%\MailCade\logs\
```

**Linux**:
```bash
~/.config/MailCade/logs/
```

Check `main.log` for errors.

## Still Stuck?

### Before Reporting

1. Check logs for errors
2. Try with curl (isolate issue)
3. Restart MailCade
4. Update to latest version
5. Check existing GitHub issues

### Report Issue

[Open an issue](https://github.com/olakunlevpn/MailCade/issues/new) with:

- ✅ OS and version
- ✅ MailCade version
- ✅ Error messages
- ✅ Steps to reproduce
- ✅ Logs (if applicable)

### Common "Not a Bug" Issues

**"MailCade doesn't actually send emails"**  
→ Correct. MailCade catches emails locally for testing.

**"Can't access from another computer"**  
→ By design. MailCade is for local development only.

**"No SPF/DKIM headers"**  
→ MailCade tests content/functionality, not email authentication.

## Prevention Tips

- Keep MailCade updated
- Use reasonable email retention (500 or less)
- Clean inbox regularly
- Use curl to test connectivity
- Plan different ports for different projects

## What's Next?

- [Settings](settings.md) - Customize MailCade
- [Contributing](../development/contributing.md) - Help improve MailCade
