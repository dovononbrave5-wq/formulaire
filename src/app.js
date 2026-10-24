require('dotenv').config();

// Échoue tout de suite, avec un message clair, si la configuration est incomplète
if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET manquant dans .env');
  process.exit(1);
}

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const passport = require('passport');
const path = require('path');

require('./config/passport'); // stratégies Google/Apple
const authRoutes = require('./routes/auth.routes');
const pagesRoutes = require('./routes/pages.routes');

const isProd = process.env.NODE_ENV === 'production';
const app = express();

// Derrière un hébergeur (proxy), nécessaire pour les cookies « secure » et le limiteur de tentatives
if (isProd) app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // formulaires et callback Apple (POST)

// Les pages passent par leurs routes (/login, /register, /dashboard) :
// l'accès direct à /dashboard.html est redirigé, pour ne pas contourner requireAuth
app.use((req, res, next) => {
  const m = req.path.match(/^\/(login|register|dashboard)\.html$/i);
  if (m) return res.redirect('/' + m[1].toLowerCase());
  next();
});

app.use(express.static(path.join(__dirname, '../public'), { index: false }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProd }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/', pagesRoutes);

// --- Gestion des erreurs (toujours après les routes) ---

// URL inconnue
app.use((req, res) => {
  if (req.originalUrl.startsWith('/auth/') || req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }
  res.status(404).send('Page introuvable');
});

// Toutes les erreurs passées à next(err) arrivent ici
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = 'Erreur interne du serveur';

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Requête invalide (JSON mal formé)';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Requête trop volumineuse';
  } else if (['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST',
              'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(err.code)) {
    status = 503; // MySQL éteint, mauvais identifiants, base absente
    message = 'Service temporairement indisponible';
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);

  const body = { error: message };
  if (!isProd) body.detail = err.message; // jamais en production
  res.status(status).json(body);
});

// Filets de sécurité pour les erreurs hors requêtes
process.on('unhandledRejection', (reason) => {
  console.error('Promesse rejetée non gérée :', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Exception non gérée :', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});