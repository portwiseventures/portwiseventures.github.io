/* Portwise Ventures: PUBLIC configuration only.
   Safe values only: the Supabase project URL and the Cloudflare Turnstile SITE key.
   Never put a service_role key, secret key, or API key in this file. */
window.PW = {
  supabaseUrl: 'https://hyvkkrfjiqmznpzpkosa.supabase.co',
  turnstileSiteKey: '0x4AAAAAAGNOgMhErV_ALm5S',
  // PUBLIC read-only key (Supabase > Project Settings > API Keys > Publishable). Paste it between the quotes.
  anonKey: 'sb_publishable_lxGQuil9W0afVdZbafaKwg_9OQhsKS8',
  // Origins allowed to show the staff dashboard inside the Portwise business app (Android app, iOS app, dev server, Windows app).
  embedOrigins: ['https://localhost', 'capacitor://localhost', 'http://localhost:5173', 'file://'],
  intakeUrl: 'https://hyvkkrfjiqmznpzpkosa.supabase.co/functions/v1/intake'
};
