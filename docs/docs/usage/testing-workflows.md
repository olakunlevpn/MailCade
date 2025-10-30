# Testing Workflows

Here's how to test common email scenarios.

## Registration emails

Register a new user in your app. The welcome email shows up in MailCade instantly.

Check that:
- The right email address got it
- The subject line looks good
- Any personalization (like the user's name) works
- Verification links actually work when clicked
- Images and branding look right

## Password resets

Trigger a password reset and check the email in MailCade.

Click the reset link - it should work. Try it again after it expires to make sure your timeout logic works.

Make sure the email has appropriate security warnings and comes from the right address.

## Order confirmations

Place a test order and check the confirmation email.

Verify the order number, items, prices, and shipping address are all correct. Make sure tables and formatting look good. Nothing worse than a broken receipt.

## Email templates

Working on a new email template? Send one through and check it in MailCade.

Resize the window to see how it looks on different screen sizes. Make sure colors match your design, fonts load, images appear, and buttons are clickable.

## Other emails to test

Don't forget about:

**Account stuff:** Email/password changes, 2FA codes, login alerts

**Billing:** Payment receipts, failed payments, renewals, refunds

**Activity:** New followers, comments, messages, reminders

## Multiple recipients

Testing emails with multiple recipients? Just add them. MailCade catches them all.

BCC addresses won't show in the headers (as expected). Check that reply-to addresses work correctly.

## Automated testing

MailCade has an API at `http://localhost:8025/api/v1/messages`. Use it in your automated tests:

```javascript
test('user receives welcome email', async ({ page }) => {
  // Trigger registration
  await page.goto('http://localhost:3000/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Check email arrived
  const response = await fetch('http://localhost:8025/api/v1/messages');
  const { messages } = await response.json();
  
  const email = messages.find(m => m.To[0].Address === 'test@example.com');
  
  expect(email.Subject).toContain('Welcome');
});
```

You can also delete all emails between tests:

```bash
curl -X DELETE http://localhost:8025/api/v1/messages
```

## Quick tips

**Use realistic data:** Test with `john@example.com`, not `test@test.com`. Use actual names for personalization.

**Test edge cases:** Long subject lines, special characters, international addresses, attachments.

**Test timing:** Make sure immediate emails send instantly. Check that delayed/scheduled emails work.

**Test failures:** What happens with invalid data? Missing fields? Make sure error handling works.

## Before each release

Create a simple checklist:

- Registration emails work
- Password resets work
- Order confirmations look right
- All your critical email flows are tested

Takes 5 minutes and catches silly mistakes.

## What's next

Want to tweak MailCade's settings? Check the [settings guide](../advanced/settings.md).

Running into problems? See [troubleshooting](../advanced/troubleshooting.md).
