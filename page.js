// Page de passage des e-mails vers l'application SOMADIR Reclamations.
// Aucune donnee n'est envoyee : le jeton de reinitialisation reste dans le fragment (#),
// jamais transmis au serveur de la page, et il est efface de la barre d'adresse.
(function () {
  'use strict';
  var PAQUET = 'ma.somadir.reclamations';
  var BASE = 'https://processsomadir.github.io';
  var FORME_JETON = /^[A-Za-z0-9_-]{20,128}$/;

  var page = document.body.getAttribute('data-page');
  var android = /Android/i.test(navigator.userAgent || '');
  var recherche = new URLSearchParams(window.location.search);

  function montrer(id) {
    var el = document.getElementById(id);
    if (el) { el.hidden = false; }
  }

  var CLE_GARDE = 'somadir-reinit';
  var VALIDITE_MS = 30 * 60 * 1000;

  function garderJeton(jeton) {
    try {
      window.sessionStorage.setItem(CLE_GARDE, JSON.stringify({ j: jeton, t: Date.now() }));
    } catch (e) { /* stockage refuse (navigation privee) : rien de plus */ }
  }

  function jetonGarde() {
    try {
      var g = JSON.parse(window.sessionStorage.getItem(CLE_GARDE) || 'null');
      if (g && typeof g.j === 'string' && typeof g.t === 'number' && Date.now() - g.t >= 0 &&
          Date.now() - g.t < VALIDITE_MS) {
        return g.j;
      }
      window.sessionStorage.removeItem(CLE_GARDE);
    } catch (e) { /* illisible ou refuse : comme absent */ }
    return '';
  }

  function lienIntent(hote, requete, retour) {
    return 'intent://' + hote + (requete ? '?' + requete : '') +
      '#Intent;scheme=somadir;package=' + PAQUET +
      ';S.browser_fallback_url=' + encodeURIComponent(BASE + retour + '?absente=1') + ';end';
  }

  // Retour de l'intent quand l'application n'est pas installee.
  if (recherche.get('absente') === '1') { montrer('etat-absente'); return; }

  if (page === 'reinitialiser') {
    var fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var jeton = fragment.get('jeton') || '';
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Le jeton quitte la barre d'adresse des la lecture. Pour qu'un rechargement ou un retour
    // arriere ne montre pas « lien incomplet », il est garde dans CET onglet seulement
    // (sessionStorage : jamais envoye, efface a la fermeture de l'onglet), 30 minutes au plus,
    // comme la validite du lien.
    if (FORME_JETON.test(jeton)) {
      garderJeton(jeton);
    } else {
      jeton = jetonGarde();
    }
    if (!FORME_JETON.test(jeton)) { montrer('etat-incomplet'); return; }
    if (!android) { montrer('etat-autre'); return; }
    document.getElementById('bouton').href =
      lienIntent('reinitialiser', 'jeton=' + encodeURIComponent(jeton), '/reinitialiser/');
    montrer('etat-android');
    return;
  }

  if (!android) { montrer('etat-autre'); return; }
  document.getElementById('bouton').href = lienIntent('accueil', '', '/ouvrir/');
  montrer('etat-android');
})();
