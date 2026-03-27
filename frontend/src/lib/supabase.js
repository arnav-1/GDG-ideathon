import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nxivdzswpepzlsyquxre.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oMksbpeu4z3k6Q0ot_Dkrg_ZBEu8lFO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
