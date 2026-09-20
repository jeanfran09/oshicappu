import { supabase } from "@/lib/supabase";

/**
 * Looks up a fandom by name (case-insensitive), creating it if it
 * doesn't exist yet - the same "fandoms" table posts already tag
 * themselves with via post_fandoms.
 */
export async function findOrCreateFandom(
  rawName: string
): Promise<string | null> {
  const name = rawName.trim();

  if (!name) return null;

  const { data: existing, error: lookupError } = await supabase
    .from("fandoms")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (lookupError) {
    console.error("Error looking up fandom:", lookupError);
    return null;
  }

  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("fandoms")
    .insert({ name })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("Error creating fandom:", createError);
    return null;
  }

  return created.id;
}
