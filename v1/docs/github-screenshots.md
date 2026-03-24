# GitHub Screenshot Workflow

This repo currently uses preview artwork for the public GitHub landing page. When replacing those assets with real product captures, use the workflow below so the screenshots stay consistent and safe to publish.

## Target Assets

Save the final images to:
- `v1/public/github/dashboard.png`
- `v1/public/github/billing.png`
- `v1/public/github/follow-up.png`

## Recommended Capture Targets

### Dashboard
- Route: `/admin/dashboard`
- Goal: show the operations hub, module cards, counts, and summary layout
- Avoid: visible staff names, customer names, account IDs, or production dates if sensitive

### Billing
- Route: `/admin/billing` or `/admin/billing/[billId]`
- Goal: show the bill queue or printable bill surface
- Avoid: customer identity, account number, bill ID, and exact private balances if needed

### Follow-Up
- Route: `/admin/follow-up`
- Goal: show overdue workflow stages, account follow-up states, and notification activity
- Avoid: customer identity, account number, phone/email, and any sensitive notes

## Capture Guidelines

- Preferred width: 1440px
- Format: PNG
- Theme: light mode only
- Crop: focus on the product UI, not browser chrome
- Keep the UI crisp and blur only sensitive fields
- Use the same zoom level across all screenshots

## Blur Rules

Blur or redact:
- names
- account numbers
- addresses
- contact details
- receipt numbers
- bill identifiers
- freeform notes that may contain internal information

Do not blur:
- navigation
- card layout
- table structure
- page titles
- high-level counts
- workflow controls

## README Swap

Once the final images exist, update the repository root `README.md` image links from:
- `./v1/public/marketing/dashboard-preview.svg`
- `./v1/public/marketing/billing-preview.svg`
- `./v1/public/marketing/follow-up-preview.svg`

to:
- `./v1/public/github/dashboard.png`
- `./v1/public/github/billing.png`
- `./v1/public/github/follow-up.png`

## Suggested Commit Order

1. Add the three PNG files.
2. Update the root `README.md` image links.
3. Commit with a message such as:

```bash
git add README.md v1/public/github/dashboard.png v1/public/github/billing.png v1/public/github/follow-up.png
git commit -m "Replace preview artwork with real blurred product screenshots"
```
