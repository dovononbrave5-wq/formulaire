const { body, validationResult } = require('express-validator');

// Règles pour l'inscription
const registerRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Adresse e-mail invalide')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Za-z]/).withMessage('Le mot de passe doit contenir une lettre')
    .matches(/\d/).withMessage('Le mot de passe doit contenir un chiffre'),

  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Les mots de passe ne correspondent pas')
];

// Règles pour la connexion (on vérifie juste la présence des champs)
const loginRules = [
  body('email').trim().isEmail().withMessage('Adresse e-mail invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

// Lit le résultat de la validation et bloque s'il y a des erreurs
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ champ: e.path, message: e.msg }))
    });
  }
  next();
}

module.exports = { registerRules, loginRules, handleValidation };