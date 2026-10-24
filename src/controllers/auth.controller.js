const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { sendVerificationEmail } = require('../config/mailer');

const SALT_ROUNDS = 12;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;        // 24 h
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;    // « Se souvenir de moi » : 30 jours
const TOKEN_REGEX = /^[a-f0-9]{64}$/;            // 32 octets en hexadécimal

// --- Utilitaires ---
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const cleanEmail = (value) => String(value || '').trim().toLowerCase();

// Crée un jeton, stocke son hash, envoie le lien par e-mail (peut lancer une erreur)
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
    const email = cleanEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (await User.findByEmail(email)) {
      return res.status(409).json({ error: 'Cet e-mail est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await User.createUser(email, passwordHash);
    const user = await User.findById(userId);

    // Le compte existe déjà : un échec d'envoi ne doit pas ressembler à un échec d'inscription
    try {
      await issueVerificationEmail(user);
    } catch (mailErr) {
      console.error('Échec de l\'envoi de l\'e-mail de vérification :', mailErr.message);
      return res.status(201).json({
        message: 'Compte créé, mais l\'e-mail de vérification n\'a pas pu être envoyé. Utilisez « Renvoyer le lien » sur la page de connexion.',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    res.status(201).json({
      message: 'Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') { // deux inscriptions simultanées : la contrainte UNIQUE protège
      return res.status(409).json({ error: 'Cet e-mail est déjà utilisé' });
    }
    next(err);
  }
}

// --- Vérification de l'e-mail ---
async function verifyEmail(req, res, next) {
  try {
    const token = req.query.token;

    // Format attendu : 64 caractères hexadécimaux (rejette tableaux, objets, valeurs absurdes)
    if (typeof token !== 'string' || !TOKEN_REGEX.test(token)) {
      return res.redirect('/login?verify=invalid');
    }

    const record = await User.findValidToken(sha256(token));
    if (!record) return res.redirect('/login?verify=invalid');

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
    const email = cleanEmail(req.body?.email);
    const user = email ? await User.findByEmail(email) : null;

    if (user && !user.is_verified) {
      try {
        await issueVerificationEmail(user);
      } catch (mailErr) {
        // On journalise, mais la réponse reste identique : elle ne révèle pas quels e-mails existent
        console.error('Échec du renvoi de l\'e-mail de vérification :', mailErr.message);
      }
    }

    res.json({ message: 'Si un compte non vérifié existe pour cet e-mail, un lien vient d\'être envoyé.' });
  } catch (err) {
    next(err);
  }
}

// --- Connexion ---
async function login(req, res, next) {
  try {
    const email = cleanEmail(req.body?.email);
    const password = req.body?.password;
    const remember = req.body?.remember === true || req.body?.remember === 'true';
    const GENERIC_ERROR = 'E-mail ou mot de passe incorrect';

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'E-mail et mot de passe requis' });
    }

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
      if (remember) req.session.cookie.maxAge = REMEMBER_MS; // sinon : cookie de session (fermeture du navigateur)
      res.json({ message: 'Connecté', redirect: '/dashboard' });
    });
  } catch (err) {
    next(err);
  }
}

// --- Déconnexion ---
function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    const finish = () => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Déconnecté', redirect: '/login' });
    };
    if (req.session) req.session.destroy(finish);
    else finish();
  });
}

module.exports = { register, verifyEmail, resendVerification, login, logout };