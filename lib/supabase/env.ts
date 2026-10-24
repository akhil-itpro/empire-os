// Reads the Supabase settings from .env.local (and Vercel). Only names live in the
// code; the founder types the values into .env.local themselves.

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabasePublishableKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** True when the three Supabase values are filled in. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.SUPABASE_SECRET_KEY,
  );
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is missing. Copy .env.example to .env.local and fill it in from the Supabase dashboard (Project Settings, API Keys).`,
    );
  }
  return value;
}
