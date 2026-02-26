import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Branch value -> worker email. Set BRANCH_EMAILS (JSON) for per-branch emails,
// e.g. {"central":"office@company.mn","gurvaljin":"gurvaljin@company.mn"}.
// Otherwise all requests go to RESEND_TO_EMAIL (one inbox for testing or routing).
function getToEmail(branch) {
  if (process.env.BRANCH_EMAILS) {
    try {
      const map = JSON.parse(process.env.BRANCH_EMAILS)
      if (map[branch]) return map[branch]
    } catch (_) {}
  }
  return process.env.RESEND_TO_EMAIL
}

function buildHtml(body) {
  const { surname, name, phone, loanTypeLabel, branchLabel, comment } = body
  const phoneFull = `+976 ${phone}`
  const accent = '#a67c52'
  const accentLight = '#f8f5f1'
  const row = (label, value) =>
    `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #5c5c5c;">${escape(label)}</td><td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #1a1a1a; text-align: right;">${escape(value)}</td></tr>`
  const rows = [
    row('Овог', surname),
    row('Нэр', name),
    row('Утас', phoneFull),
    row('Зээлийн төрөл', loanTypeLabel),
    row('Салбар', branchLabel),
  ]
  if (comment) rows.push(row('Тайлбар', comment))

  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Зээлийн хүсэлт</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #e8eae9; line-height: 1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8eae9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: ${accent}; padding: 20px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; letter-spacing: 0.02em;">ЗЭЭЛИЙН ХҮСЭЛТ</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">Шинэ хүсэлт ирлээ</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                ${rows.join('')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px 20px; background-color: ${accentLight}; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">Энэ имэйл нь цахим зээлийн хүсэлтийн системээс автоматаар илгээгдсэн.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function escape(str) {
  if (str == null || str === '') return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { surname, name, phone, loanType, loanTypeLabel, branch, branchLabel, comment } = body
  if (!surname || !name || !phone || !branch || !branchLabel || !loanTypeLabel) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const toEmail = getToEmail(branch)
  if (!toEmail) {
    return res.status(500).json({
      error: 'No email configured for this branch. Set RESEND_TO_EMAIL or BRANCH_EMAILS.',
    })
  }

  const from = process.env.RESEND_FROM || 'onboarding@resend.dev'
  const subject = `Зээлийн хүсэлт: ${branchLabel} - ${name} ${surname}`

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: toEmail,
      subject,
      html: buildHtml({ surname, name, phone, loanTypeLabel, branchLabel, comment: comment || '' }),
    })
    if (error) {
      return res.status(400).json({ error: error.message || 'Resend error' })
    }
    return res.status(200).json({ success: true, id: data?.id })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send email' })
  }
}
