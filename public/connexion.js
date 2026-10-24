const form = document.getElementById('formulaire-connexion');
const resultat = document.getElementById('resultat');
const btnConnexion = document.getElementById('btn-connexion');
const btnRenvoyer = document.getElementById('btn-renvoyer');

function afficher(message, ok = false) {
  resultat.textContent = message;
  resultat.style.color = ok ? 'green' : 'crimson';
}

// Messages envoyés par le serveur dans l'adresse (/login?verified=1, ?verify=invalid, ?error=...)
const params = new URLSearchParams(window.location.search);
if (params.get('verified') === '1') {
  afficher('Adresse e-mail confirmée. Vous pouvez vous connecter.', true);
} else if (params.get('verify') === 'invalid') {
  afficher('Lien de vérification invalide ou expiré. Saisissez votre e-mail et demandez un nouveau lien.');
  btnRenvoyer.hidden = false;
} else if (params.get('error') === 'provider') {
  afficher('Cette méthode de connexion n\'est pas encore disponible.');
} else if (params.get('error') === 'oauth') {
  afficher('La connexion avec ce service a échoué. Réessayez ou utilisez votre e-mail.');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  btnRenvoyer.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  if (!email || !password) {
    return afficher('Veuillez remplir tous les champs.');
  }

  btnConnexion.disabled = true;
  afficher('Connexion en cours…', true);

  try {
    // La vérification du mot de passe se fait uniquement sur le serveur
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember })
    });
    const data = await res.json();

    if (res.ok) {
      window.location.href = data.redirect || '/dashboard';
    } else if (data.code === 'EMAIL_NOT_VERIFIED') {
      afficher(data.error);
      btnRenvoyer.hidden = false;
    } else if (data.errors) {
      afficher(data.errors.map(e => e.message).join(' · '));
    } else {
      afficher(data.error || 'Une erreur est survenue.');
    }
  } catch (err) {
    afficher('Impossible de joindre le serveur.');
  } finally {
    btnConnexion.disabled = false;
  }
});

btnRenvoyer.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  if (!email) return afficher('Saisissez votre e-mail ci-dessus, puis cliquez à nouveau.');

  btnRenvoyer.disabled = true;
  try {
    const res = await fetch('/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    afficher(data.message || data.error, res.ok);
  } catch (err) {
    afficher('Impossible de joindre le serveur.');
  } finally {
    btnRenvoyer.disabled = false;
  }
});