// Suivi de soins (docs/06 F22) : lecture du suivi ouvert, prise de nouvelles à l'ouverture du fil.
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export const followupKey = (plantId: string) => ['followup', plantId] as const;

export type Followup = { topic: string; dueAt: Date };

/** Suivi ouvert de la plante (cache : ligne brute, persistable). */
export function useOpenFollowup(plantId: string) {
  return useQuery({
    queryKey: followupKey(plantId),
    select: (row): Followup | null =>
      row ? { topic: row.topic, dueAt: new Date(row.due_at) } : null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plant_followups')
        .select('topic, due_at')
        .eq('plant_id', plantId)
        .eq('status', 'open')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Ouverture du fil : si le suivi est échu, la plante ajoute un message (vrai si c'est le cas). */
export async function checkFollowup(plantId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ checked?: boolean }>('plant-chat', {
    body: { plantId, check: true },
  });
  return !error && !!data?.checked;
}
