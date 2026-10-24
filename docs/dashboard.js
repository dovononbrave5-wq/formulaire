async function loadUser() {
  try {
    const res = await fetch('/api/me');

    // Session expirée : retour à la connexion
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const user = await res.json();
    document.getElementById('welcome').textContent = `Connecté en tant que ${user.email}`;
    document.getElementById('user-id').textContent = user.id;
    document.getElementById('user-email').textContent = user.email;
  } catch (err) {
    document.getElementById('welcome').textContent = 'Impossible de charger vos informations.';
  }
}

async function logout() {
  try {
    const res = await fetch('/auth/logout', { method: 'POST' });
    const data = await res.json();
    window.location.href = data.redirect || '/login';
  } catch (err) {
    alert('La déconnexion a échoué, réessayez.');
  }
}

document.getElementById('logout-btn').addEventListener('click', logout);
loadUser();