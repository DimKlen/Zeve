import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { usePlants } from '@/features/garden/api';
import { GardenPlants } from '@/features/garden/GardenPlants';
import { GardenSkeleton } from '@/features/garden/GardenSkeleton';
import { gardenSubtitle } from '@/features/garden/gardenRules';
import { useGardens } from '@/features/gardens/api';
import { GardenHeader } from '@/features/gardens/GardenHeader';
import { GardenOptionsSheet } from '@/features/gardens/GardenOptionsSheet';
import { placeLabel } from '@/features/gardens/gardenRules';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { t } from '@/i18n';
import { go, goBack } from '@/motion/transitions';
import { layout, makeStyles, space, type } from '@/theme';

/** Un jardin (ouvert depuis l'accueil à plusieurs jardins) : l'écran « Mon jardin » de ce lieu. */
export default function GardenDetailScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: gardens, isSuccess } = useGardens();
  const { data: plants } = usePlants();
  const [menu, setMenu] = useState(false);
  const garden = gardens?.find((g) => g.id === id);
  const own = plants?.filter((p) => p.gardenId === id) ?? [];
  const now = new Date();

  const addPlant = () => {
    useNewPlantDraft.getState().reset(id);
    go('newPlant');
  };
  const backHome = () => go('garden', { replace: true, anim: 'back' });

  return (
    <Screen name="gardenDetail" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <GardenHeader
          title={garden?.name ?? ''}
          place={garden ? placeLabel(garden) : undefined}
          subtitle={own.length ? gardenSubtitle(own, now) : undefined}
          onBack={goBack}
          onMenu={garden ? () => setMenu(true) : undefined}
          onAdd={addPlant}
        />
        {/* Jardin supprimé entre-temps (dernière plante retirée ailleurs) : on le dit simplement. */}
        {isSuccess && !garden ? (
          <Text style={styles.gone}>{t('gardens.gone')}</Text>
        ) : !plants || !garden ? (
          <GardenSkeleton />
        ) : (
          <GardenPlants plants={own} now={now} />
        )}
      </ScrollView>
      {garden && (
        <GardenOptionsSheet
          key={`${garden.id}-${garden.name}-${garden.city ?? ''}`}
          garden={garden}
          plantCount={own.length}
          visible={menu}
          onClose={() => setMenu(false)}
          onDeleted={backHome}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  content: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadTabs,
    paddingBottom: space.x5 * 2,
    gap: space.xl,
  },
  gone: { ...type.body, color: colors.inkMuted, textAlign: 'center', marginTop: space.x5 },
}));
