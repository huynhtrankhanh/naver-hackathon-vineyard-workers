import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.huynhtrankhanh.smartmoney',
  appName: 'SmartMoney',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#FFFFFF',
      style: 'LIGHT'
    }
  }
};

export default config;
