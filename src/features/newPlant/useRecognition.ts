import { useCallback } from 'react';

import { showToast } from '@/components/Toast';
import { isNetworkError } from '@/features/auth/auth';
import { useAuthStore } from '@/features/auth/authStore';
import { t } from '@/i18n';
import { go } from '@/motion/transitions';

import { IdentifyTimeoutError, identifySpecies, pickPlantPhoto, uploadTmpPhoto } from './api';
import { useNewPlantDraft } from './draftStore';

/**
 * « Prendre une photo » (docs/06 F7) : photo → Storage → identify-species.
 * Non reconnue, trop lente ou en erreur → toast et bascule vers la liste des espèces.
 */
export function useRecognition() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const setDraft = useNewPlantDraft((s) => s.set);

  return useCallback(async () => {
    if (!userId) return;
    const photo = await pickPlantPhoto();
    if (!photo) return;
    const previous = useNewPlantDraft.getState();
    setDraft({ status: 'recognizing' });
    try {
      const photoPath = await uploadTmpPhoto(photo, userId);
      const result = await identifySpecies(photoPath);
      if (!result.speciesId) {
        setDraft({ status: 'idle' });
        showToast(t('newPlant.notRecognized'));
        go('species');
        return;
      }
      setDraft({
        status: 'idle',
        speciesId: result.speciesId,
        source: 'photo',
        confidence: result.confidence,
        photoPath,
      });
    } catch (e) {
      // Une espèce choisie avant la photo reste choisie.
      setDraft({ status: 'idle', speciesId: previous.speciesId, source: previous.source });
      if (e instanceof IdentifyTimeoutError) showToast(t('newPlant.identifyTimeout'));
      else if (isNetworkError(e)) showToast(t('toast.offline'));
      else showToast(t('newPlant.notRecognized'));
      go('species');
    }
  }, [userId, setDraft]);
}
