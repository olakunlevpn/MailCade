# Viewing Emails

All emails your app tries to send show up in MailCade's inbox. Click any email to see the full content.

## The inbox

You'll see:

- Who it's from
- The subject line
- Who it's going to (To, CC, BCC)
- When it arrived
- A preview of the content

Click an email to open it.

## Reading emails

When you open an email, you get three tabs:

**Content:** The actual email body. If the email has both HTML and plain text versions, you can switch between them. Images and styling show up just like they would in a real email client.

**Headers:** All the technical stuff - sender, recipients, message IDs, content types, custom headers. Handy when you're debugging or need to verify specific metadata.

**Raw:** The complete email source with all MIME parts, encoding, everything. For when you really need to dig deep.

## What you can do

**Delete emails:** Click the delete button. Gone.

**Forward to yourself:** Click forward and your email client opens. Useful when you want to test how the email looks on your phone or in Gmail.

## Cleaning up

Want to delete everything? Go to Settings → Server Configuration and temporarily set Email Retention to 10. Wait a few seconds and old emails disappear. Then set it back.

Or just restart the server.

## Testing tips

**Check responsive design:** Resize the MailCade window to see how emails look at different widths.

**Test links:** All links are clickable. Click through password resets, verification links, whatever you're testing.

**Verify personalization:** Make sure user names, order numbers, and other dynamic content look right. Use realistic test data to catch formatting issues.

**Check attachments:** You'll see file names and sizes. Make sure everything looks correct.

## What's next

Ready to test specific workflows like password resets? Check out [testing workflows](testing-workflows.md).

Having issues? The [troubleshooting guide](../advanced/troubleshooting.md) can help.
