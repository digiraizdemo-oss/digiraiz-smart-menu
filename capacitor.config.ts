import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.digiraiz.restaurant',
  appName: 'DigiRaiz Restaurant',
  webDir: 'public',
  server: {
    url: 'https://digiraiz-smart-menu.vercel.app',
    cleartext: false
  }
};

export default config;