const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true pour le port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
async function sendVerificationEmail(to, link) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,          // ex. "Mon App <no-reply@monapp.com>"
    to,
    subject: 'Confirmez votre adresse e-mail',
    text: `Bienvenue ! Confirmez votre e-mail en ouvrant ce lien (valable 24 h) : ${link}`,
    html: `
      <p>Bienvenue !</p>
      <p>Cliquez sur le bouton pour confirmer votre adresse e-mail (lien valable 24 h) :</p>
      <p><a href="${link}" style="padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">
        Confirmer mon e-mail
      </a></p>
      <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>`
  });
}
module.exports = { sendVerificationEmail };