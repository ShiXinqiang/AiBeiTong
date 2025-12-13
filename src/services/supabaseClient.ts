import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://exwbtgsyqrvzgwddmxbn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4d2J0Z3N5cXJ2emd3ZGRteGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzI0MTQsImV4cCI6MjA4MTIwODQxNH0.dNTYuo-37jVZ7rl_bA-rxgGG4UuvM1VI22eHnlj55Z4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);