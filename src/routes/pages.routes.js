const express = require('express');
const path = require('path');
const { requireAuth, redirectIfAuth } = require('../middlewares/auth');

const router = express.Router();
const page = (name) => path.join(__dirname, '../../public', name);

router.get('/', (req, res) => res.redirect('/login'));

// Pages publiques (un utilisateur déjà connecté est renvoyé vers le dashboard)
router.get('/login', redirectIfAuth, (req, res) => res.sendFile(page('login.html')));
router.get('/register', redirectIfAuth, (req, res) => res.sendFile(page('register.html')));

// Page protégée
router.get('/dashboard', requireAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(page('dashboard.html'));
});

// Infos de l'utilisateur connecté (sans données sensibles)
router.get('/api/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

module.exports = router;