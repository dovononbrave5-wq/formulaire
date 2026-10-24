const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { sendVerificationEmail } = require('../config/mailer');
const SALT_ROUNDS = 12;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
// --- Utilitaires ---
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
// Crée un jeton, stocke son hash, envoie le lien par e-mail
async function issueVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString('hex'); // valeur envoyée à l'utilisateur
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await User.saveVerificationToken(user.id, sha256(token), expiresAt); // seul le hash est stocké
  const link = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, link);
}
// --- Inscription ---
async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Cet e-mail est déjà utilisé' });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await User.createUser(email, passwordHash);
    const user = await User.findById(userId);
    await issueVerificationEmail(user);
    res.status(201).json({
      message: 'Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.'
    });
  } catch (err) {
    // Deux inscriptions simultanées : la contrainte UNIQUE de MySQL protège
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Cet e-mail est déjà utilisé' });
    }
    next(err);
  }
}
// --- Vérification de l'e-mail ---
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Lien invalide.');
    const record = await User.findValidToken(sha256(token));
    if (!record) {
      return res.status(400).send('Lien invalide ou expiré. Demandez un nouveau lien depuis la page de connexion.');
    }
    await User.markVerified(record.user_id);
    await User.deleteTokensForUser(record.user_id); // jeton à usage unique
    res.redirect('/login?verified=1');
  } catch (err) {
    next(err);
  }
}
// --- Renvoi du lien ---
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    const user = email ? await User.findByEmail(String(email).trim().toLowerCase()) : null;
    // On envoie seulement si le compte existe et n'est pas vérifié...
    if (user && !user.is_verified) {
      await issueVerificationEmail(user);
    }
    // ...mais la réponse est toujours la même (ne révèle pas quels e-mails existent)
    res.json({ message: 'Si un compte non vérifié existe pour cet e-mail, un lien vient d\'être envoyé.' });
  } catch (err) {
    next(err);
  }
}
// --- Connexion ---
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const GENERIC_ERROR = 'E-mail ou mot de passe incorrect';
    const user = await User.findByEmail(email);
    // Compte inexistant ou compte social sans mot de passe : même message générique
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: GENERIC_ERROR });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: GENERIC_ERROR });
    // Mot de passe correct, mais e-mail non confirmé
    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Veuillez d\'abord confirmer votre adresse e-mail.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    // Crée la session (même mécanisme que Google/Apple)
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ message: 'Connecté', redirect: '/dashboard' });
    });
  } catch (err) {
    next(err);
  }
}
// --- Déconnexion ---
function logout(req, res, next) {
  req.logout((err) => {                 // passport 0.6+ : callback obligatoire
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Déconnecté', redirect: '/login' });
    });
  });
}
module.exports = { register, verifyEmail, resendVerification, login, logout };