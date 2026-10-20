import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cuentasclaras.app",
  appName: "Cuentas Claras",
  webDir: "dist",
  android: {
    // El contenido viaja dentro del APK; la API se consume por HTTPS.
    allowMixedContent: false,
  },
  plugins: {
    // Las llamadas a la API salen por HTTP nativo: no dependen de CORS.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
