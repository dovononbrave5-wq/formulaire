const { body, validationResult } = require('express-validator');

// E-mail : espaces retirés et minuscules (volontairement sans normalizeEmail, qui supprime
// les points des adresses Gmail et ne correspondrait plus à l'e-mail renvoyé par Google)
const emailRule = () =>
  body('email')
    .isString().withMessage('Adresse e-mail invalide').bail()
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Adresse e-mail invalide')
    .isLength({ max: 254 }).withMessage('Adresse e-mail trop longue');

// Règles pour l'inscription (identiques à celles de inscription.js côté navigateur)
const registerRules = [
  emailRule(),

  body('password')
    .isString().withMessage('Mot de passe invalide').bail()
    .isLength({ min: 8, max: 72 }).withMessage('Le mot de passe doit contenir entre 8 et 72 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir une minuscule')
    .matches(/\d/).withMessage('Le mot de passe doit contenir un chiffre')
    .matches(/[^A-Za-z0-9\s]/).withMessage('Le mot de passe doit contenir un caractère spécial'),

  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Les mots de passe ne correspondent pas')
];

// Règles pour la connexion (on vérifie juste la présence des champs)
const loginRules = [
  emailRule(),
  body('password')
    .isString().withMessage('Mot de passe requis').bail()
    .notEmpty().withMessage('Mot de passe requis')
    .isLength({ max: 128 }).withMessage('Mot de passe invalide')
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