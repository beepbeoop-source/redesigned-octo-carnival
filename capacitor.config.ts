import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notmugil.attendance',
  appName: 'Staff Attendance & Payroll',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
