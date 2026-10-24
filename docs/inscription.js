const form = document.getElementById('formulaire');
const resultat = document.getElementById('resultat');
const bouton = document.getElementById('btn-inscrit');

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Même règle que le serveur (validate.js) : 8 à 72 caractères, majuscule, minuscule, chiffre, caractère spécial
const regexPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,72}$/;

function afficher(message, ok = false) {
  resultat.textContent = message;
  resultat.style.color = ok ? 'green' : 'crimson';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Vérifications rapides côté navigateur (confort seulement : le serveur revérifie tout)
  if (!regexEmail.test(email)) {
    return afficher('Adresse e-mail invalide !');
  }
  if (!regexPassword.test(password)) {
    return afficher('Le mot de passe doit contenir de 8 à 72 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
  }
  if (password !== confirmPassword) {
    return afficher('Les mots de passe ne correspondent pas !');
  }

  bouton.disabled = true;
  afficher('Envoi en cours…', true);

  try {
    // Le hachage du mot de passe se fait uniquement sur le serveur
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword })
    });
    const data = await res.json();

    if (res.ok) {
      form.reset();
      // Compte créé mais e-mail non parti : message affiché comme avertissement
      afficher(data.message, data.code !== 'EMAIL_SEND_FAILED');
    } else if (data.errors) {
      afficher(data.errors.map(e => e.message).join(' · '));
    } else {
      afficher(data.error || 'Une erreur est survenue.');
    }
  } catch (err) {
    afficher('Impossible de joindre le serveur.');
  } finally {
    bouton.disabled = false;
  }
});