
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpbfexyyjhzxtkhrclpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYmZleHl5amh6eHRraHJjbHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTk2NTYsImV4cCI6MjA1NjYzNTY1Nn0.wdKlSc7hU7yJziCUH0dFo78d2D4DOcy6T7axnqkR3_o';

export const supabase = createClient(supabaseUrl, supabaseKey);
