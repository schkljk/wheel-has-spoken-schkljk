import type { CapacitorConfig } from '@capacitor/cli';

// The Android app (npm run apk:build, or the android workflow): the same game, served from inside the APK.
const config: CapacitorConfig = {
  appId: 'com.wheelhasspoken.game',
  appName: 'The Wheel Has Spoken',
  webDir: 'dist',
  android: {
    // the game draws its own backgrounds behind the status and navigation bars
    backgroundColor: '#14182b',
  },
};

export default config;
