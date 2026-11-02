import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const DEFAULT_ROLES = ['Comentarista/preces', 'Primeira Leitura', 'Segunda Leitura']
export const supabaseConfigured = Boolean(url && anonKey)
export const demoMode = import.meta.env.DEV && !supabaseConfigured
const supabase = supabaseConfigured ? createClient(url, anonKey) : null
export { supabase }

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function getDemoData() {
  try {
    const saved = localStorage.getItem('ministros-da-palavra-demo-v1')
    if (!saved) return null
    const data = JSON.parse(saved)
    return { ...data, roles: data.roles?.length ? data.roles : DEFAULT_ROLES }
  } catch {
    return null
  }
}

export async function loadData() {
  if (!supabase) return getDemoData()
  const [people, events, assignments, roles] = await Promise.all([
    supabase.from('ministers').select('*').order('name'),
    supabase.from('events').select('*').order('event_date'),
    supabase.from('assignments').select('*'),
    supabase.from('minister_roles').select('*').eq('active', true).order('name'),
  ])
  const error = people.error || events.error || assignments.error || roles.error
  if (error) throw error
  return {
    ministers: people.data.map((p) => ({ id: p.id, name: p.name, whatsapp: p.whatsapp, active: p.active })),
    events: events.data.map((e) => ({ id: e.id, title: e.title, date: e.event_date, time: e.event_time, kind: e.kind })),
    assignments: assignments.data.map((a) => ({ id: a.id, eventId: a.event_id, ministerId: a.minister_id, role: a.role })),
    roles: roles.data.length ? roles.data.map((r) => r.name) : DEFAULT_ROLES,
  }
}

export async function insertMinister(person) {
  const { error } = await supabase.from('ministers').insert({ name: person.name.trim(), whatsapp: person.whatsapp.trim(), active: true })
  if (error) throw error
}

export async function insertEvent(event) {
  const { data, error } = await supabase.from('events').insert({ title: event.title, event_date: event.date, event_time: event.time, kind: event.kind }).select('id').single()
  if (error) throw error
  return data.id
}

export async function insertAssignment(assignment) {
  const { error } = await supabase.from('assignments').insert({ event_id: assignment.eventId, minister_id: assignment.ministerId, role: assignment.role })
  if (error) throw error
}

export async function insertRole(name) {
  const { error } = await supabase.from('minister_roles').insert({ name: name.trim() })
  if (error) throw error
}

export async function setMinisterActive(ministerId, active) {
  const { error } = await supabase.from('ministers').update({ active }).eq('id', ministerId)
  if (error) throw error
}
