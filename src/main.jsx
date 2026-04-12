import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './Banner.css';

// --- FONCTIONS UTILITAIRES (GTM & COOKIES) ---
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }


// --- RECUPERATION DYNAMIQUE DES VARIABLES ---
const settings = window.cmpSettings || {};

const DOMAIN = settings.domain || window.location.hostname;
const SITE_NAME = settings.siteName || 'notre site';
const LOGO_URL = settings.logo || 'https://via.placeholder.com/150x50?text=Logo';
const BG_IMAGE_URL = settings.bgImage || 'https://via.placeholder.com/600x800?text=Image+de+fond';
const PRIMARY_COLOR = settings.primaryColor || '#000000';
const POLICIES_URL = settings.policiesUrl || '/politique-de-confidentialite/';
const GCP_FUNCTION_URL = 'https://save-consent-141278816244.europe-west1.run.app';

const GTM = {
  updateConsent: (consentMode) => {
    try {
      const hasAds = consentMode.includes('4');
      const hasPerso = consentMode.includes('3');
      const hasAnalytics = consentMode.includes('2');

      gtag('consent', 'update', {
        'ad_storage': hasAds ? 'granted' : 'denied',
        'ad_personalization': hasAds ? 'granted' : 'denied',
        'ad_user_data': hasAds ? 'granted' : 'denied',
        'functionality_storage': hasPerso ? "granted" : "denied",
        'personalization_storage': hasPerso ? "granted" : "denied",
        'analytics_storage': hasAnalytics ? 'granted' : 'denied',
        'security_storage': "granted"
      });

      window.dataLayer.push({
        'event': 'consent_mode_updated',
        'consent_mode': consentMode
      });
    } catch (e) { console.warn("GTM bloqué par le navigateur"); }
  }
};

const Cookies = {
  get: (cname) => {
    try {
      const name = cname + '=';
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
      }
      return 'absent';
    } catch (e) {
      // Si le mode privé bloque la lecture, on fait comme s'il n'y avait pas de cookie
      return 'absent'; 
    }
  },
  set: (consent) => {
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 365);
      const rootDomain = DOMAIN.split('.').slice(-2).join('.');
      document.cookie = `consent_mode=${consent};expires=${expires.toUTCString()};domain=.${rootDomain};path=/`;
      const id = Date.now() + '.' + Math.random().toString(36).substr(2, 3);
      document.cookie = `consent_record=${id};expires=${expires.toUTCString()};domain=.${rootDomain};path=/`;
    } catch (e) {
      console.warn("Écriture des cookies bloquée en mode privé");
    }
  }
};
const saveConsentToGCP = async (consentMode, consentRecord) => {
  if (!GCP_FUNCTION_URL) return;
  try {
    await fetch(GCP_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentMode,
        consentRecord,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (err) {
    console.warn('CMP: échec de l\'enregistrement GCP', err);
  }
};

// --- LE COMPOSANT REACT ---
const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [view, setView] = useState('banner');
  const [toggles, setToggles] = useState({ 2: false, 3: false, 4: false });

  useEffect(() => {
    const consentMode = Cookies.get('consent_mode');
    const consentRecord = Cookies.get('consent_record');

    if (consentMode === 'absent' || consentMode === 'empty' || consentRecord === 'absent') {
      setIsVisible(true);
    } else {
  GTM.updateConsent(consentMode);
  setIsClosed(true);
}
  }, []);

  const closePanel = () => {
  setIsVisible(false);
  setIsClosed(true);
  setView('banner');
};

const handleAcceptAll = () => {
  const fullConsent = '1,2,3,4';
  Cookies.set(fullConsent);
  GTM.updateConsent(fullConsent);
  saveConsentToGCP(fullConsent, Cookies.get('consent_record')); // ✅ AJOUTER
  closePanel();
};

const handleDenyAll = () => {
  const minimalConsent = '1';
  Cookies.set(minimalConsent);
  GTM.updateConsent(minimalConsent);
  saveConsentToGCP(minimalConsent, Cookies.get('consent_record')); // ✅ AJOUTER
  closePanel();
};

const handleSavePreferences = () => {
  const selectedCats = ['1'];
  if (toggles[2]) selectedCats.push('2');
  if (toggles[3]) selectedCats.push('3');
  if (toggles[4]) selectedCats.push('4');
  const customConsent = selectedCats.join(',');
  Cookies.set(customConsent);
  GTM.updateConsent(customConsent);
  saveConsentToGCP(customConsent, Cookies.get('consent_record')); // ✅ AJOUTER
  closePanel();
};

const handleToggle = (id) => {
  setToggles(prev => ({ ...prev, [id]: !prev[id] }));
};

const handleReopen = () => {
  setView('preferences');
  setIsVisible(true);
  setIsClosed(false);
};

if (!isVisible) return (
  isClosed
    ? <button className="cmp-reopen-btn" onClick={handleReopen} title="Gérer mes cookies">🍪</button>
    : null
);

  return (
    <div className="cmp-modal-overlay" style={{ '--cmp-color': PRIMARY_COLOR }}>
  <div className="cmp-modal-container">
    
    {/* VUE BANNIÈRE */}
    {view === 'banner' && (
      <div className="cmp-modal-content cmp-view-banner">
        <div className="cmp-image-column" style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}></div>
        <div className="cmp-text-column">

          {/* LOGO CENTRÉ EN HAUT */}
          <div className="cmp-header-center">
            <img src={LOGO_URL} alt={`Logo ${SITE_NAME}`} />
          </div>

          <div className="cmp-main-text">
            <h1 className="cmp-title">Tout d'abord bienvenue !</h1>
            <p className="cmp-intro">
              Bienvenue sur <strong className="cmp-site-name">{SITE_NAME}</strong> ! Voici quelques bonnes raisons de dire « oui » à nos cookies pour une expérience personnalisée :
            </p>
            <div className="cmp-reason-list">
              <div className="cmp-reason-item">
                <p><strong>Personnalisation :</strong> Proposer du contenu adapté à vos centres d'intérêt.</p>
              </div>
              <div className="cmp-reason-item">
                <p><strong>Gain de temps :</strong> Inutile de retaper vos informations à chaque visite.</p>
              </div>
            </div>
            <p className="cmp-policy-link">
              Pour en savoir plus, consultez notre{' '}
              <a href={POLICIES_URL} target="_blank" rel="noopener noreferrer">politique de confidentialité</a>.
            </p>

            {/* BOUTON REFUS SOUS LA POLITIQUE */}
            <div className="cmp-dismiss-wrapper">
              <button onClick={handleDenyAll} className="cmp-link-dismiss">
                Continuer sans accepter &rarr;
              </button>
            </div>
          </div>

          <div className="cmp-footer-actions">
            <button className="cmp-link-preferences" onClick={() => setView('preferences')}>
              Paramétrer
            </button>
            <button className="cmp-button-accept" onClick={handleAcceptAll} style={{ backgroundColor: 'var(--cmp-color)', borderColor: 'var(--cmp-color)' }}>
              Accepter et continuer
            </button>
          </div>

        </div>
      </div>
    )}

    {/* VUE PRÉFÉRENCES */}
    {view === 'preferences' && (
      <div className="cmp-modal-content cmp-view-preferences">
        <div className="cmp-header-bar">
          <div className="cmp-logo">
            <img src={LOGO_URL} alt={`Logo ${SITE_NAME}`} style={{ maxHeight: '60px' }} />
          </div>
          <h2 style={{margin: 0, fontSize: '20px'}}>Centre de préférences</h2>
        </div>
        <span className="cmp-description_center">
          Lorsque vous consultez un site Web, des données peuvent être stockées ou récupérées sous la forme de cookies. Vous pouvez modifier vos préférences ci-dessous.
        </span>

        <div className="cmp-category">
          <div className="cmpcategory_1">
            <span className="cmpcat_title">Cookies strictement nécessaires</span>
            <span className="cmpcat_description">Absolument nécessaires au bon fonctionnement de notre site et ne peuvent pas être désactivés.</span>
            <div className="toggle_validation">
              <label className="switch">
                <input type="checkbox" checked disabled />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className={toggles[2] ? "cmpcategory_1" : "cmpcategory_2"}>
            <span className="cmpcat_title">Mesure de la performance</span>
            <span className="cmpcat_description">Ces cookies nous permettent de mesurer l'activité des utilisateurs sur notre site.</span>
            <div className="toggle_validation">
              <label className="switch">
                <input type="checkbox" checked={toggles[2]} onChange={() => handleToggle(2)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className={toggles[3] ? "cmpcategory_1" : "cmpcategory_2"}>
            <span className="cmpcat_title">Cookies de fonctionnalité</span>
            <span className="cmpcat_description">Ces cookies nous permettent de mettre en oeuvre des fonctionnalités de personnalisation.</span>
            <div className="toggle_validation">
              <label className="switch">
                <input type="checkbox" checked={toggles[3]} onChange={() => handleToggle(3)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className={toggles[4] ? "cmpcategory_1" : "cmpcategory_2"}>
            <span className="cmpcat_title">Publicité ciblée</span>
            <span className="cmpcat_description">Ces cookies peuvent être déposés par nos partenaires publicitaires.</span>
            <div className="toggle_validation">
              <label className="switch">
                <input type="checkbox" checked={toggles[4]} onChange={() => handleToggle(4)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eeeeee' }}>
          <button className="cmp-link-preferences" onClick={handleDenyAll}>
            Tout refuser
          </button>
          <button className="cmp-button-accept" onClick={handleSavePreferences} style={{ backgroundColor: 'var(--cmp-color)', borderColor: 'var(--cmp-color)' }}>
            SAUVEGARDER MA SÉLECTION
          </button>
        </div>
      </div>
    )}

  </div>
</div>
    )

// --- INITIALISATION DU WIDGET (Version Ultra-Robuste) ---
const initCMP = () => {
  try {
    // ALERTE 1 : On vérifie si la fonction se lance bien
    alert("1. Le script démarre bien sur Chrome iOS !"); 

    let container = document.getElementById('mon-cmp-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mon-cmp-root';
      document.body.appendChild(container);
    }
    
    // ALERTE 2 : On vérifie si le conteneur est bien créé
    alert("2. Le conteneur HTML est créé !");

    const root = createRoot(container);
    root.render(<CookieBanner />);
    
  } catch (erreur) {
    // ALERTE 3 : S'il y a un crash invisible, on l'affiche de force !
    alert("CRASH REACT : " + erreur.message);
  }
};

// --- SÉCURITÉ DE LANCEMENT POUR CHROME IOS ---
// Chrome iOS a parfois des ratés avec document.readyState via GTM
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // La page est déjà chargée, on lance tout de suite
  initCMP();
} else {
  // La page charge encore, on attend
  document.addEventListener('DOMContentLoaded', initCMP);
  // Filet de sécurité supplémentaire au cas où DOMContentLoaded rate
  window.addEventListener('load', initCMP); 
}
