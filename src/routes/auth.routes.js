const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const { registerRules, loginRules, handleValidation } = require('../middlewares/validate');

const router = express.Router();

// Limite les tentatives (force brute). Le message est en JSON : les scripts de la page lisent la réponse avec res.json()
const limiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez dans quelques minutes.' }
});
const authLimiter = limiter(Number(process.env.AUTH_RATE_LIMIT) || 7);
const resendLimiter = limiter(5);

// --- E-mail + mot de passe ---
router.post('/register', authLimiter, registerRules, handleValidation, authController.register);
router.post('/login', authLimiter, loginRules, handleValidation, authController.login);
router.post('/logout', authController.logout);

// --- Vérification de l'e-mail ---
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', resendLimiter, authController.resendVerification);

// --- Google et Apple : actifs seulement si les clés sont dans .env ---
const googleOn = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const appleOn = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID &&
                        process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);

// Fournisseur non configuré : retour à la page de connexion avec un message, au lieu d'une erreur 500
const providerGuard = (enabled) => (req, res, next) =>
  enabled ? next() : res.redirect('/login?error=provider');

// Callback commun : toute erreur (compte refusé, e-mail non vérifié...) renvoie vers /login?error=oauth
function oauthCallback(provider) {
  return (req, res, next) => {
    passport.authenticate(provider, (err, user) => {
      if (err || !user) {
        if (err) console.error(`Échec de la connexion ${provider} :`, err.message);
        return res.redirect('/login?error=oauth');
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.redirect('/dashboard');
      });
    })(req, res, next);
  };
}

// --- Google ---
router.get('/google', providerGuard(googleOn), passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', providerGuard(googleOn), oauthCallback('google'));

// --- Apple (le callback est en POST) ---
router.get('/apple', providerGuard(appleOn), passport.authenticate('apple'));
router.post('/apple/callback', providerGuard(appleOn), oauthCallback('apple'));

module.exports = router;