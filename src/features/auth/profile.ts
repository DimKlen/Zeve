import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { useAuthStore } from './authStore';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Profil de l'utilisateur connecté (prénom, onboarding, rappels). */
export function useProfile() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}

/** Prénom donné par Apple au 1er login, sans écraser un prénom existant. */
export async function saveFirstName(userId: string, firstName: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ first_name: firstName })
    .eq('id', userId)
    .is('first_name', null);
}

type OnboardingChoice = { remindersEnabled: boolean; pushToken: string | null };

/** Fin de l'onboarding (docs/06 F2) : rappels, jeton push et `onboarded_at`. */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return async ({ remindersEnabled, pushToken }: OnboardingChoice) => {
    if (!userId) throw new Error('Pas de session.');
    const { data, error } = await supabase
      .from('profiles')
      .update({
        reminders_enabled: remindersEnabled,
        expo_push_token: pushToken,
        onboarded_at: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw error;
    queryClient.setQueryData(profileKey(userId), data);
    return data;
  };
}
