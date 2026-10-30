import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

import { showToast } from '@/components/Toast';
import { t } from '@/i18n';

import { statusOf, type GardenPlant } from './gardenRules';

const KEY = 'zeve-seen-stages';

/**
 * Passage de stade (docs/06 F5, non maquetté) : au premier affichage après le changement,
 * toast « {Nom} a grandi ! Elle est maintenant Jeune. ».
 */
export function useGrowthToasts(plants: GardenPlant[] | undefined) {
  useEffect(() => {
    if (!plants?.length) return;
    let cancelled = false;
    void (async () => {
      const raw = await AsyncStorage.getItem(KEY).catch(() => null);
      const seen: Record<string, number> = raw ? JSON.parse(raw) : {};
      const next: Record<string, number> = {};
      let grown: { name: string; stage: number } | null = null;
      for (const plant of plants) {
        const stage = statusOf(plant).stage;
        next[plant.id] = stage;
        const before = seen[plant.id];
        if (before !== undefined && stage > before && !grown)
          grown = { name: plant.nickname, stage };
      }
      if (cancelled) return;
      await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
      if (grown) {
        showToast(t('plant.grownToast', { name: grown.name, stage: t(`stage.${grown.stage}`) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plants]);
}
