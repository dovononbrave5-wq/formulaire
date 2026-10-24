const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { registerRules, loginRules, handleValidation } = require('../middlewares/validate');
const router = express.Router();
// Limite les tentatives pour freiner les attaques par force brute
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 7,
  message: 'Trop de tentatives, réessayez plus tard.'
});
// --- E-mail + mot de passe ---
router.post('/register', authLimiter, registerRules, handleValidation, authController.register);
router.post('/login', authLimiter, loginRules, handleValidation, authController.login);
router.post('/logout', authController.logout);
// --- Vérification de l'e-mail ---
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);
// --- Google ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',passport.authenticate('google', { failureRedirect: '/login' }),
(req, res) => res.redirect('/dashboard')
);
// --- Apple (le callback est en POST) ---
router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback',passport.authenticate('apple', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/dashboard')
);
module.exports = router;