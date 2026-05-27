import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourname.financeled',
  appName: 'Finance Ledger',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // In production, point to your deployed API (Render/Railway/etc)
    // url: 'https://your-api.onrender.com',
    // For local testing on device (replace with your machine's IP):
    // url: 'http://192.168.1.100:5000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0d0f14',
      showSpinner: false
    }
  }
}

export default config
