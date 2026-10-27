import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.raggio.netpocket',
  appName: 'NetPocket',
  webDir: 'dist',
  backgroundColor: '#0B0F19',
  loggingBehavior: 'none',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
