import { supabase } from './supabase'
import type { Profile } from './database.types'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  organisationName: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Sign up a new user with their profile information
 * The profile is automatically created via database trigger
 */
export async function signUp({ email, password, fullName, organisationName }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organisation_name: organisationName,
      },
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: { fullName?: string; organisationName?: string }) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      organisation_name: updates.organisationName,
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

/**
 * Update the user's password (when logged in)
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

