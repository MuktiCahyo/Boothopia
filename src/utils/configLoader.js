/**
 * Config Loader Utility
 *
 * Strategy:
 *  1. Fetch /frame/configs.json from the server (the "source of truth" that
 *     gets baked into every Netlify deployment via the /public folder).
 *  2. Merge with any per-device localStorage overrides (Admin Panel saves here).
 *  3. LocalStorage always wins over the server file so admins on-site can
 *     still make tweaks without a redeploy.
 *
 * To "lock" a config for all devices: export it from the Admin Panel and
 * replace /public/frame/configs.json with that file, then redeploy.
 */

const LS_KEY = 'boothopia_frame_configs';
const SERVER_CONFIG_URL = '/frame/configs.json';

let _cache = null; // In-memory cache so we only fetch once per session

export async function loadConfigs() {
  if (_cache) return _cache;

  // 1. Try to load server config (baked into deployment)
  let serverConfig = {};
  try {
    const res = await fetch(SERVER_CONFIG_URL, { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === 'object') {
        serverConfig = json;
      }
    }
  } catch {
    // Server file missing or network error — that's fine, fall through
  }

  // 2. Load localStorage overrides (set by Admin Panel on this device)
  let localConfig = {};
  try {
    localConfig = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    localConfig = {};
  }

  // 3. Merge: localStorage keys override server keys
  _cache = { ...serverConfig, ...localConfig };
  return _cache;
}

export function saveConfigs(configs) {
  localStorage.setItem(LS_KEY, JSON.stringify(configs));
  _cache = configs; // update in-memory cache
}

export function clearCache() {
  _cache = null;
}
