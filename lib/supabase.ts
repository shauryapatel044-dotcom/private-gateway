import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pbalmdgeqarijsgjkykn.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM0MTcyNCwiZXhwIjoyMTA2OTE3NzI0fQ.w5c4k4lmI3qsOaMWbQ2UGn0xgg4z-N7ES585puUlmy8';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
