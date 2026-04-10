import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './Banner.css';

// --- RECUPERATION DYNAMIQUE DES VARIABLES ---
const settings = window.cmpSettings || {};

const DOMAIN = settings.domain || window.location.hostname;
const SITE_NAME = settings.siteName || 'notre site';
const LOGO_URL = settings.logo || 'https://via.placeholder.com/150x50?text=Logo';
const BG_IMAGE_URL = settings.bgImage || 'https://via.placeholder.com/600x800?text=Image+de+fond';
const PRIMARY_COLOR = settings.primaryColor || '#000000';
const POLICIES_URL = '/politique-de-confidentialite/';

// --- FONCTIONS UTILITAIRES (GTM & COOKIES) ---
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

const GTM = {
  setDefault: () => {
    gtag('consent', 'default', {
      'ad_storage': "denied", 'analytics_storage': "denied",
      'functionality_storage': "denied", 'personalization_storage': "denied",
      'security_storage': "granted", 'ad_user_data': "denied",
      'ad_personalization': "denied", 'wait_for_update': 500
    });
  },
  updateConsent: (consentMode) => {
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
  }
};

const Cookies = {
  get: (cname) => {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return 'absent';
  },
  set: (consent) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 365);
    document.cookie = `consent_mode=${consent};expires=${expires.toUTCString()};domain=.${DOMAIN};path=/`;
    
    const id = Date.now() + '.' + Math.random().toString(36).substr(2, 3);
    document.cookie = `consent_record=${id};expires=${expires.toUTCString()};domain=.${DOMAIN};path=/`;
  }
};

// --- LE COMPOSANT REACT ---
const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [view, setView] = useState('banner');
  const [toggles, setToggles] = useState({ 2: false, 3: false, 4: false });

  useEffect(() => {
    GTM.setDefault();
    const consentMode = Cookies.get('consent_mode');
    const consentRecord = Cookies.get('consent_record');

    if (consentMode === 'absent' || consentMode === 'empty' || consentRecord === 'absent') {
      setIsVisible(true);
    } else {
      GTM.updateConsent(consentMode);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = '1,2,3,4';
    Cookies.set(fullConsent);
    GTM.updateConsent(fullConsent);
    setIsVisible(false);
  };

  const handleDenyAll = () => {
    const minimalConsent = '1';
    Cookies.set(minimalConsent);
    GTM.updateConsent(minimalConsent);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const selectedCats = ['1'];
    if (toggles[2]) selectedCats.push('2');
    if (toggles[3]) selectedCats.push('3');
    if (toggles[4]) selectedCats.push('4');
    
    const customConsent = selectedCats.join(',');
    Cookies.set(customConsent);
    GTM.updateConsent(customConsent);
    setIsVisible(false);
  };

  const handleToggle = (id) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isVisible) return null;

  return (
    <div className="cmp-modal-overlay" style={{ '--cmp-color': PRIMARY_COLOR }}>
      <div className="cmp-modal-container">
        
        {/* VUE BANNIÈRE */}
        {view === 'banner' && (
          <div className="cmp-modal-content cmp-view-banner">
            <div className="cmp-image-column" style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}></div>
            <div className="cmp-text-column">
              <div className="cmp-header-bar">
                <div className="cmp-logo">
                  <img src={LOGO_URL} alt={`Logo ${SITE_NAME}`} />
                </div>
                <button onClick={handleDenyAll} className="cmp-link-dismiss">
                  Continuer sans accepter &rarr;
                </button>
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

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button className="cmp-button-accept" onClick={handleSavePreferences} style={{ backgroundColor: 'var(--cmp-color)', borderColor: 'var(--cmp-color)' }}>
                SAUVEGARDER MA SÉLECTION
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- INITIALISATION DU WIDGET ---
const initCMP = () => {
  let container = document.getElementById('mon-cmp-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'mon-cmp-root';
    document.body.appendChild(container);
  }
  const root = createRoot(container);
  root.render(<CookieBanner />);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCMP);
} else {
  initCMP();
}
