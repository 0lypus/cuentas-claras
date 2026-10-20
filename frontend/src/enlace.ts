// Link público del grupo. Dentro del APK el origen es https://localhost,
// así que se usa VITE_WEB_URL para que el link compartido abra la versión web.
const SITIO = (import.meta.env.VITE_WEB_URL ?? window.location.origin).replace(/\/+$/, "");

export const enlaceGrupo = (codigo: string) => `${SITIO}/#/${codigo}`;
