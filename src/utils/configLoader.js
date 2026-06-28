import { supabase } from './supabaseClient';

const LS_KEY = 'boothopia_frame_configs';

let _cache = null; // In-memory cache so we only fetch once per session

export async function loadConfigs() {
  if (_cache) return _cache;

  // 1. Try to load from Supabase Database
  let dbConfig = {};
  try {
    const { data, error } = await supabase
      .from('frame_configs')
      .select('frame_id, slots');
    
    if (!error && data) {
      dbConfig = data.reduce((acc, item) => {
        acc[item.frame_id] = { slots: item.slots };
        return acc;
      }, {});
    }
  } catch {
    // Database missing or network error — fall through
  }

  // 2. Load localStorage overrides (set by Admin Panel on this device)
  let localConfig = {};
  try {
    localConfig = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    localConfig = {};
  }

  // 3. Merge: localStorage keys override database keys
  _cache = { ...dbConfig, ...localConfig };
  return _cache;
}

export async function saveConfigs(configs) {
  localStorage.setItem(LS_KEY, JSON.stringify(configs));
  _cache = configs; // update in-memory cache

  // Upsert all configs to Supabase Database
  try {
    const upsertData = Object.entries(configs).map(([frame_id, cfg]) => ({
      frame_id,
      slots: cfg.slots,
      updated_at: new Date().toISOString(),
    }));

    if (upsertData.length > 0) {
      await supabase
        .from('frame_configs')
        .upsert(upsertData, { onConflict: 'frame_id' });
    }
  } catch (err) {
    console.error('Failed to save configs to Supabase:', err);
  }
}

export function clearCache() {
  _cache = null;
}

