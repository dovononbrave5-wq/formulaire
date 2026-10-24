const db = require('../config/db');
// --- Lecture ---
async function findByEmail(email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}
async function findById(id) {
  const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}
async function findByGoogleId(googleId) {
  const [rows] = await db.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
  return rows[0] || null;
}
async function findByAppleId(appleId) {
  const [rows] = await db.execute('SELECT * FROM users WHERE apple_id = ?', [appleId]);
  return rows[0] || null;
}
// --- Création ---
// Compte classique : passwordHash fourni, is_verified = 0
async function createUser(email, passwordHash) {
  const [result] = await db.execute(
    'INSERT INTO users (email, password_hash, is_verified) VALUES (?, ?, 0)',
    [email, passwordHash]
  );
  return result.insertId;
}
// Compte social (Google/Apple) : pas de mot de passe, e-mail déjà vérifié
async function createSocialUser(email, provider, providerId) {
  const column = provider === 'google' ? 'google_id' : 'apple_id'; // liste blanche, jamais d'entrée utilisateur
  const [result] = await db.execute(
    `INSERT INTO users (email, ${column}, is_verified) VALUES (?, ?, 1)`,
    [email, providerId]
  );
  return result.insertId;
}
// --- Mise à jour ---
async function markVerified(userId) {
  await db.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [userId]);
}
// Lie un compte existant à Google ou Apple
async function linkProvider(userId, provider, providerId) {
  const column = provider === 'google' ? 'google_id' : 'apple_id';
  await db.execute(`UPDATE users SET ${column} = ?, is_verified = 1 WHERE id = ?`, [providerId, userId]);
}
async function updatePassword(userId, passwordHash) {
  await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}
// --- Jetons de vérification d'e-mail ---
async function saveVerificationToken(userId, tokenHash, expiresAt) {
  // Un seul jeton actif par utilisateur : on supprime les anciens
  await db.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId]);
  await db.execute(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
}
async function findValidToken(tokenHash) {
  const [rows] = await db.execute(
    'SELECT * FROM email_verification_tokens WHERE token_hash = ? AND expires_at > NOW()',
    [tokenHash]
  );
  return rows[0] || null;
}
async function deleteTokensForUser(userId) {
  await db.execute('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId]);
}
module.exports = {
  findByEmail, findById, findByGoogleId, findByAppleId,
  createUser, createSocialUser,
  markVerified, linkProvider, updatePassword,
  saveVerificationToken, findValidToken, deleteTokensForUser
};