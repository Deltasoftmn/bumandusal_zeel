# Зээлийн хүсэлт (Loan Application)

React loan application form (JavaScript, no TypeScript).

**Repository:** [github.com/Deltasoftmn/bumandusal_zeel](https://github.com/Deltasoftmn/bumandusal_zeel)

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## Build

```bash
npm run build
```

## Email (Resend)

On submit, the form sends an email to the **worker of the selected branch** via [Resend](https://resend.com).

### Vercel environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your API key from [Resend Dashboard](https://resend.com/api-keys). |
| `RESEND_TO_EMAIL` | Yes* | Inbox where all applications are sent (e.g. `loans@yourcompany.mn`). Use this if every branch shares one inbox. |
| `RESEND_FROM` | No | Sender address (default: `onboarding@resend.dev`). Use a [verified domain](https://resend.com/domains) in production. |
| `RESEND_LOGO_URL` | No | Full URL to your logo image (e.g. `https://yoursite.vercel.app/logo.png`) to show a mini logo in the email header. |
| `BRANCH_EMAILS` | No | JSON map of branch → worker email. Example: `{"central":"office@company.mn","gurvaljin":"gurvaljin@company.mn"}`. If set, the selected branch’s worker gets the email; otherwise all go to `RESEND_TO_EMAIL`. |

\* Either `RESEND_TO_EMAIL` or `BRANCH_EMAILS` (with the selected branch key) must be set.

### Local testing with API

To test the send-email API locally, use Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

Then open http://localhost:3000 and submit the form. Add the same env vars in a `.env` file or in `vercel env pull`.

## Deploy (GitHub Pages)

Code is pushed to `main`. The repo includes a GitHub Actions workflow that builds and deploys to GitHub Pages on every push to `main`.

1. In the repo go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. After the next push (or the first workflow run), the site will be available at:
   **https://deltasoftmn.github.io/bumandusal_zeel/**
