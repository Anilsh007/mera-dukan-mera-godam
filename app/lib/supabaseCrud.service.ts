import { createSupabaseAdminClient } from "@/app/api/_lib/auth"

export type CrudResult<T> = {
  data: T | null
  error: string | null
}

export async function upsertByUser<TPayload extends Record<string, unknown>>(
  table: string,
  payload: TPayload,
  onConflict = "id"
): Promise<CrudResult<TPayload>> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from(table).upsert(payload as unknown as never, { onConflict })
  return { data: error ? null : payload, error: error?.message ?? null }
}

export async function deleteByUser(table: string, id: string, userId: string): Promise<CrudResult<{ id: string }>> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId)
  return { data: error ? null : { id }, error: error?.message ?? null }
}

export async function listByUser<T>(table: string, userId: string, orderBy = "created_at") {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).order(orderBy, { ascending: false })
  return { data: (data || []) as T[], error: error?.message ?? null }
}
