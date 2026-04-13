import { test, expect } from '@playwright/test';

const TEST_URL = 'http://localhost:3000/tests/index.html';

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test('La bannière CMP s\'affiche au premier chargement', async ({ page }) => {
  await page.goto(TEST_URL);
  await expect(page.locator('.cmp-modal-overlay')).toBeVisible({ timeout: 5000 });
});

test('Le titre de la bannière est correct', async ({ page }) => {
  await page.goto(TEST_URL);
  await expect(page.locator('.cmp-title')).toContainText('Tout d\'abord bienvenue');
});

test('Clic sur "Accepter" pose le cookie consent_mode=1,2,3,4 et ferme la bannière', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.locator('.cmp-button-accept').click();
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find(c => c.name === 'consent_mode');
  expect(consentCookie).toBeDefined();
  expect(consentCookie.value).toBe('1,2,3,4');
});

test('Clic sur "Continuer sans accepter" pose le cookie consent_mode=1 et ferme la bannière', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.locator('.cmp-link-dismiss').click();
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find(c => c.name === 'consent_mode');
  expect(consentCookie).toBeDefined();
  expect(consentCookie.value).toBe('1');
});

test('Clic sur "Paramétrer" ouvre la vue préférences', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.locator('.cmp-link-preferences').click();
  await expect(page.locator('.cmp-view-preferences')).toBeVisible();
});

test('Les toggles de préférences fonctionnent', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.locator('.cmp-link-preferences').click();
  await expect(page.locator('.cmp-view-preferences')).toBeVisible();

  // Clic direct via JS car le checkbox a width:0 height:0 dans le CSS
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes[1].click(); // coche
  });
  
  const analyticsToggle = page.locator('input[type="checkbox"]').nth(1);
  await expect(analyticsToggle).toBeChecked();
  
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes[1].click(); // décoche
  });
  await expect(analyticsToggle).not.toBeChecked();
});

test('Sauvegarde préférences partielles pose le bon cookie', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.locator('.cmp-link-preferences').click();
  await expect(page.locator('.cmp-view-preferences')).toBeVisible();

  // Clic direct via JS car le checkbox a width:0 height:0 dans le CSS
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes[1].click();
  });

  await page.locator('text=SAUVEGARDER MA SÉLECTION').click();
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
  const cookies = await page.context().cookies();
  const consentCookie = cookies.find(c => c.name === 'consent_mode');
  expect(consentCookie.value).toBe('1,2');
});

test('Le bouton 🍪 apparaît après fermeture et réouvre les préférences', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.locator('.cmp-button-accept').click();
  const reopenBtn = page.locator('.cmp-reopen-btn');
  await expect(reopenBtn).toBeVisible();
  await reopenBtn.click();
  await expect(page.locator('.cmp-view-preferences')).toBeVisible();
});

test('La bannière ne s\'affiche pas si le cookie est déjà posé', async ({ page, context }) => {
  await context.addCookies([
    { name: 'consent_mode', value: '1,2,3,4', domain: 'localhost', path: '/' },
    { name: 'consent_record', value: '1744123456789.abc', domain: 'localhost', path: '/' }
  ]);
  await page.goto(TEST_URL);
  await expect(page.locator('.cmp-modal-overlay')).not.toBeVisible();
});

test('Sur mobile l\'image est cachée et la bannière s\'affiche correctement', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(TEST_URL);
  await expect(page.locator('.cmp-image-column')).not.toBeVisible();
  await expect(page.locator('.cmp-modal-overlay')).toBeVisible();
  await expect(page.locator('.cmp-header-center img')).toBeVisible();
});
