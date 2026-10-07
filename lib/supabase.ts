import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pbalmdgeqarijsgjkykn.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_VP6VRn45KW3wEwzmsV9cqQ_E16_adXT';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
