// ─── Supabase konfigurace ─────────────────────────────────────────────────────
// Vyplň tvé hodnoty ze Supabase → Settings → API
const SUPABASE_URL  = 'https://susdtbhqwlbgjchpueol.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1c2R0Ymhxd2xiZ2pjaHB1ZW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTA2NTIsImV4cCI6MjA4OTIyNjY1Mn0.Ik5qbDNDXhIWXHZmLlXg4zdvBUA1e4cvNhl1QLcT1x0';

window.db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Vložit skóre ──────────────────────────────────────────────────────────────
window.dbInsertScore = async function(name, score) {
    const { error } = await window.db
        .from('scores')
        .insert({ name, score });
    if (error) console.warn('Supabase insert error:', error.message);
};

// ── Načíst top 50 ─────────────────────────────────────────────────────────────
window.dbGetTopScores = async function() {
    const { data, error } = await window.db
        .from('scores')
        .select('name, score, created_at')
        .order('score', { ascending: false })
        .limit(50);
    if (error) {
        console.warn('Supabase fetch error:', error.message);
        return null; // null = fallback na localStorage
    }
    return data;
};
