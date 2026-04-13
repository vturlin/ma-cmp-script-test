const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // Timeout global par test
  timeout: 30000,
  
  // Rapport d'erreur détaillé en HTML
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'] // affiche les résultats dans les logs GitHub Actions
  ],
  
  use: {
    // Screenshot automatique en cas d'échec
    screenshot: 'only-on-failure',
    
    // Vidéo en cas d'échec
    video: 'retain-on-failure',
    
    // Trace complète en cas d'échec (clics, network, console)
    trace: 'retain-on-failure',
  },
  
  projects: [
    { name: 'Chromium', use: { browserName: 'chromium' } },
    { name: 'Firefox',  use: { browserName: 'firefox'  } },
    { name: 'Safari',   use: { browserName: 'webkit'   } },
  ],
});
