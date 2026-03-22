/**
 * AB Testing by Antoon - Snippet client
 *
 * Comment installer sur votre site :
 *
 * 1. Ajoute ce code dans le <head> de ton site, AVANT tout autre script :
 *
 *   <script>
 *   // Anti-flicker : cache la page le temps d'appliquer les changements
 *   !function(){var e=document.createElement("style");e.id="abt-hider";
 *   e.innerHTML="body{opacity:0!important;transition:opacity .15s ease}";
 *   document.head.appendChild(e);
 *   setTimeout(function(){var el=document.getElementById("abt-hider");
 *   if(el)el.parentNode.removeChild(el)},3000)}();
 *   </script>
 *   <script src="https://TON_DOMAINE_VERCEL.vercel.app/snippet.js" data-site-id="TON_API_KEY"></script>
 *
 * 2. Pour tracker une conversion, appelle n'importe où sur ta page :
 *   <script>window.AntoonABT && window.AntoonABT.track();</script>
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var SITE_ID = script ? script.getAttribute('data-site-id') : null;
  var BASE_URL = script ? script.src.replace(/\/snippet\.js.*$/, '') : '';

  if (!SITE_ID) {
    console.warn('[AntoonABT] Attribut data-site-id manquant sur le script.');
    showBody();
    return;
  }

  var STORAGE_PREFIX = 'abt_';

  // ─── Visiteur unique ───────────────────────────────────────────────
  function getVisitorId() {
    var key = STORAGE_PREFIX + 'vid';
    try {
      var vid = localStorage.getItem(key);
      if (!vid) {
        vid = 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem(key, vid);
      }
      return vid;
    } catch (e) {
      return 'v' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    }
  }

  // ─── Persistance de la variation assignée ─────────────────────────
  function getStoredVariant(experimentId) {
    try { return localStorage.getItem(STORAGE_PREFIX + experimentId); } catch (e) { return null; }
  }

  function storeVariant(experimentId, variantId) {
    try { localStorage.setItem(STORAGE_PREFIX + experimentId, variantId); } catch (e) {}
  }

  // ─── Assignation aléatoire pondérée ───────────────────────────────
  function pickVariant(variants) {
    var rand = Math.random() * 100;
    var cumulative = 0;
    for (var i = 0; i < variants.length; i++) {
      cumulative += (variants[i].weight || 50);
      if (rand < cumulative) return variants[i];
    }
    return variants[variants.length - 1];
  }

  // ─── Application des changements ──────────────────────────────────
  function applyChanges(changes) {
    if (!changes || !changes.length) return;
    changes.forEach(function (change) {
      try {
        switch (change.type) {
          case 'css':
            var style = document.createElement('style');
            style.setAttribute('data-abt', '1');
            style.textContent = change.value;
            document.head.appendChild(style);
            break;

          case 'html':
            if (change.selector) {
              var el = document.querySelector(change.selector);
              if (el) el.innerHTML = change.value;
            }
            break;

          case 'js':
            // eslint-disable-next-line no-new-func
            (new Function(change.value))();
            break;

          case 'redirect':
            if (change.value && window.location.href.indexOf(change.value) === -1) {
              window.location.replace(change.value);
            }
            break;
        }
      } catch (err) {
        console.warn('[AntoonABT] Erreur lors de l\'application du changement:', err);
      }
    });
  }

  // ─── Envoi d'un événement (vue ou conversion) ─────────────────────
  function sendEvent(experimentId, variantId, eventType) {
    var payload = JSON.stringify({
      experimentId: experimentId,
      variantId: variantId,
      visitorId: getVisitorId(),
      eventType: eventType,
      url: window.location.href,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          BASE_URL + '/api/track',
          new Blob([payload], { type: 'application/json' })
        );
      } else {
        fetch(BASE_URL + '/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // ─── Afficher le body après les changements ────────────────────────
  function showBody() {
    var hider = document.getElementById('abt-hider');
    if (hider && hider.parentNode) hider.parentNode.removeChild(hider);
  }

  // ─── Point d'entrée principal ──────────────────────────────────────
  fetch(BASE_URL + '/api/config?siteId=' + encodeURIComponent(SITE_ID))
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (experiments) {
      experiments.forEach(function (exp) {
        if (!exp.variants || !exp.variants.length) return;

        var storedId = getStoredVariant(exp.id);
        var variant = null;

        if (storedId) {
          for (var i = 0; i < exp.variants.length; i++) {
            if (exp.variants[i].id === storedId) { variant = exp.variants[i]; break; }
          }
        }

        if (!variant) {
          variant = pickVariant(exp.variants);
          storeVariant(exp.id, variant.id);
        }

        // Appliquer les changements seulement pour la variation B (pas le contrôle)
        if (!variant.is_control && variant.changes && variant.changes.length) {
          applyChanges(variant.changes);
        }

        sendEvent(exp.id, variant.id, 'view');
      });
    })
    .catch(function (err) {
      console.warn('[AntoonABT] Impossible de charger les expériences:', err);
    })
    .finally(function () {
      showBody();
    });

  // ─── API publique ──────────────────────────────────────────────────
  window.AntoonABT = {
    /**
     * Appeler pour tracker une conversion.
     * Exemple : <button onclick="window.AntoonABT.track()">Acheter</button>
     */
    track: function () {
      try {
        var keys = Object.keys(localStorage).filter(function (k) {
          return k.indexOf(STORAGE_PREFIX) === 0 && k !== STORAGE_PREFIX + 'vid';
        });
        keys.forEach(function (key) {
          var experimentId = key.replace(STORAGE_PREFIX, '');
          var variantId = localStorage.getItem(key);
          if (variantId) sendEvent(experimentId, variantId, 'conversion');
        });
      } catch (e) {}
    },
  };
})();
