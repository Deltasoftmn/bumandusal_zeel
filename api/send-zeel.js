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
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Зээлийн хүсэлт</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-top: 0;">Шинэ зээлийн хүсэлт</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Овог</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escape(surname)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Нэр</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escape(name)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Утас</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escape(phoneFull)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Зээлийн төрөл</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escape(loanTypeLabel)}</td></tr>
    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Салбар</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escape(branchLabel)}</td></tr>
    ${comment ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Тайлбар</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escape(comment)}</td></tr>` : ''}
  </table>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Энэ имэйл нь цахим зээлийн хүсэлтийн системээс автоматаар илгээгдсэн.</p>
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
