import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.raggiodev.netpocket',
  appName: 'NetPocket Cybersecurity',
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
  plugins: {
    SystemBars: {
      // Light status/navigation bar icons on the #0B0F19 tactical background.
      style: 'DARK',
      // Native padding keeps the WebView strictly between the system bars.
      insetsHandling: 'css',
    },
  },
};

export default config;
