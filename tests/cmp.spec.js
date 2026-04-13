const { test, expect } = require('@playwright/test');

/**
 * Avant chaque test, on efface les cookies pour repartir d'un état propre
 * comme si c'était la première visite de l'utilisateur.
 */
test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

// ─────────────────────────────────────────────
// TEST 1 : La bannière s'affiche au chargement
// ─────────────────────────────────────────────
test('La bannière CMP s\'affiche au premier chargement', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  const banner = page.locator('.cmp-modal-overlay');
  await expect(banner).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────
// TEST 2 : Le titre est correct
// ─────────────────────────────────────────────
test('Le titre de la bannière est correct', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  const title = page.locator('.cmp-title');
  await expect(title).toContainText('Tout d\'abord bienvenue');
});

// ─────────────────────────────────────────────
// TEST 3 : Accepter tout
// ─────────────────────────────────────────────
test('Clic sur "Accepter" pose le cookie consent_mode=1,2,3,4 et ferme la bannière', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.locator('.cmp-button-accept').click();
  
  // Vérifie que la bannière est fermée
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
  
  // Vérifie le cookie
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find(c => c.name === 'consent_mode');
  expect(consentCookie).toBeDefined();
  expect(consentCookie.value).toBe('1,2,3,4');
});

// ─────────────────────────────────────────────
// TEST 4 : Refuser tout
// ─────────────────────────────────────────────
test('Clic sur "Continuer sans accepter" pose le cookie consent_mode=1 et ferme la bannière', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.locator('.cmp-link-dismiss').click();
  
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
  
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find(c => c.name === 'consent_mode');
  expect(consentCookie).toBeDefined();
  expect(consentCookie.value).toBe('1');
});

// ─────────────────────────────────────────────
// TEST 5 : Vue préférences
// ─────────────────────────────────────────────
test('Clic sur "Paramétrer" ouvre la vue préférences', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.locator('.cmp-link-preferences').click();
  
  await expect(page.locator('.cmp-view-preferences')).toBeVisible();
});

// ─────────────────────────────────────────────
// TEST 6 : Toggles dans les préférences
// ─────────────────────────────────────────────
test('Les toggles de préférences fonctionnent', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.locator('.cmp-link-preferences').click();
  
  // Coche le toggle analytics (catégorie 2)
  const analyticsToggle = page.locator('input[type="checkbox"]').nth(1);
  await analyticsToggle.check();
  await expect(analyticsToggle).toBeChecked();
  
  // Décoche
  await analyticsToggle.uncheck();
  await expect(analyticsToggle).not.toBeChecked();
});

// ─────────────────────────────────────────────
// TEST 7 : Sauvegarde des préférences partielles
// ─────────────────────────────────────────────
test('Sauvegarde préférences partielles pose le bon cookie', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.locator('.cmp-link-preferences').click();
  
  // Coche uniquement analytics (catégorie 2)
  const analyticsToggle = page.locator('input[type="checkbox"]').nth(1);
  await analyticsToggle.check();
  
  // Sauvegarde
  await page.locator('text=SAUVEGARDER MA SÉLECTION').click();
  
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
  
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find(c => c.name === 'consent_mode');
  expect(consentCookie.value).toBe('1,2');
});

// ─────────────────────────────────────────────
// TEST 8 : Bouton flottant de re-consentement
// ─────────────────────────────────────────────
test('Le bouton 🍪 apparaît après fermeture et réouvre les préférences', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Ferme la bannière
  await page.locator('.cmp-button-accept').click();
  
  // Le bouton flottant doit apparaître
  const reopenBtn = page.locator('.cmp-reopen-btn');
  await expect(reopenBtn).toBeVisible();
  
  // Clic sur le bouton flottant
  await reopenBtn.click();
  
  // La vue préférences doit s'ouvrir
  await expect(page.locator('.cmp-view-preferences')).toBeVisible();
});

// ─────────────────────────────────────────────
// TEST 9 : Pas de double affichage
// ─────────────────────────────────────────────
test('La bannière ne s\'affiche pas si le cookie est déjà posé', async ({ page, context }) => {
  // On pose le cookie manuellement avant de charger la page
  await context.addCookies([
    {
      name: 'consent_mode',
      value: '1,2,3,4',
      domain: 'localhost',
      path: '/'
    },
    {
      name: 'consent_record',
      value: '1744123456789.abc',
      domain: 'localhost',
      path: '/'
    }
  ]);
  
  await page.goto('http://localhost:3000');
  
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
});

// ─────────────────────────────────────────────
// TEST 10 : Responsive mobile
// ─────────────────────────────────────────────
test('Sur mobile l\'image est cachée et la bannière s\'affiche correctement', async ({ page }) => {
  // Simule un iPhone 12
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000');
  
  // L'image doit être cachée
  await expect(page.locator('.cmp-image-column')).not.toBeVisible();
  
  // La bannière doit être visible
  await expect(page.locator('.cmp-modal-overlay')).toBeVisible();
  
  // Le logo doit être visible
  await expect(page.locator('.cmp-header-center img')).toBeVisible();
});
