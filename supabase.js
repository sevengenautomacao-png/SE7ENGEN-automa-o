import { createClient } from '@supabase/supabase-js'

// URL and Anon Key should be provided via environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Fallback Images for Products ---
const DEFAULT_ELECTRICAL_IMAGES = [
    'public/industrial_automation_hero_webp_1769464630093.png',
    'public/plc_controller_webp_1769464690191.png',
    'public/electrical_panel_webp_1769464752729.png',
    'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&q=80&w=600&h=400',
    'https://images.unsplash.com/photo-1505744386214-51dba16a26fc?auto=format&fit=crop&q=80&w=600&h=400',
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=600&h=400',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=600&h=400'
];

export const getProductImage = (imageUrl, id) => {
    if (imageUrl && imageUrl.trim() !== '') return imageUrl;
    const seed = typeof id === 'number' ? id : (id ? id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0);
    const index = seed % DEFAULT_ELECTRICAL_IMAGES.length;
    return DEFAULT_ELECTRICAL_IMAGES[index];
};
