// Bloque l'accès si l'utilisateur n'est pas connecté
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  // Pour une route d'API : réponse JSON 401 ; pour une page : redirection
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  res.redirect('/login');
}
// Évite qu'un utilisateur déjà connecté revoie /login ou /register
function redirectIfAuth(req, res, next) {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  next();
}
module.exports = { requireAuth, redirectIfAuth };