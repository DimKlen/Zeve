import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { showToast } from '@/components/Toast';
import { usePlants, useWatering } from '@/features/garden/api';
import { EmptyGarden } from '@/features/garden/EmptyGarden';
import { GardenPlants } from '@/features/garden/GardenPlants';
import { GardenSkeleton } from '@/features/garden/GardenSkeleton';
import { gardenSubtitle, todoList } from '@/features/garden/gardenRules';
import { TodoCard } from '@/features/garden/TodoCard';
import { useGrowthToasts } from '@/features/garden/useGrowthToasts';
import { useGardens, useRefreshGardens } from '@/features/gardens/api';
import { GardenCard } from '@/features/gardens/GardenCard';
import { GardenHeader } from '@/features/gardens/GardenHeader';
import { GardenOptionsSheet } from '@/features/gardens/GardenOptionsSheet';
import { placeLabel, summarizeGardens, type GardenSummary } from '@/features/gardens/gardenRules';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { t } from '@/i18n';
import type { riseDelay } from '@/motion';
import { go } from '@/motion/transitions';
import { thirstLine } from '@/plants/plantStatus';
import { layout, makeStyles, space, useColors } from '@/theme';

const DELAYS: (keyof typeof riseDelay)[] = ['d2', 'd3', 'd4'];

/**
 * Accueil (docs/04 §7, étendu aux jardins) : un seul jardin s'affiche directement, comme avant ;
 * à partir de deux, la liste des jardins avec les arrosages du jour de tous les jardins.
 */
export default function HomeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { data: plants, isError, refetch, isRefetching } = usePlants();
  const { data: gardens } = useGardens();
  const refreshGardens = useRefreshGardens();
  const [pulled, setPulled] = useState(false);
  const [menu, setMenu] = useState(false);
  useGrowthToasts(plants);

  // Échec sans cache (non maquetté) : squelettes + toast ; ne jamais montrer un faux « jardin vide ».
  useEffect(() => {
    if (isError && !plants) showToast(t('toast.offline'));
  }, [isError, plants]);

  // Une seule date par rendu : toutes les cartes calculent leur état au même instant.
  const now = new Date();
  const summaries = plants && gardens ? summarizeGardens(gardens, plants, now) : null;
  const single = summaries?.length === 1 ? summaries[0]! : null;

  // Brouillon vidé à chaque ouverture depuis le + (docs/05), jardin présélectionné s'il est unique.
  const addPlant = () => {
    useNewPlantDraft.getState().reset(single?.garden.id);
    go('newPlant');
  };

  let header;
  if (single) {
    header = (
      <GardenHeader
        title={single.garden.name}
        place={placeLabel(single.garden)}
        weather={single.garden.weatherNow}
        subtitle={gardenSubtitle(single.plants, now)}
        onMenu={() => setMenu(true)}
        onAdd={addPlant}
      />
    );
  } else if (summaries && summaries.length > 1) {
    const thirsty = summaries.reduce((n, s) => n + s.thirsty, 0);
    header = (
      <GardenHeader
        title={t('gardens.homeTitle')}
        subtitle={t('gardens.homeCount', { count: summaries.length, thirst: thirstLine(thirsty) })}
        onAdd={addPlant}
      />
    );
  } else {
    header = <GardenHeader title={t('garden.title')} onAdd={addPlant} />;
  }

  return (
    <Screen name="garden" refocusEnter="fade" edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pulled && isRefetching}
            onRefresh={() => {
              setPulled(true);
              refreshGardens();
              void refetch().finally(() => setPulled(false));
            }}
            tintColor={colors.forest}
            colors={[colors.forest]}
          />
        }
      >
        {header}

        {!summaries ? (
          <GardenSkeleton />
        ) : !summaries.length ? (
          <EmptyGarden onAdd={addPlant} />
        ) : single ? (
          <GardenPlants plants={single.plants} now={now} />
        ) : (
          <GardenList summaries={summaries} now={now} />
        )}
      </ScrollView>

      {single && (
        <GardenOptionsSheet
          key={`${single.garden.id}-${single.garden.name}-${single.garden.city ?? ''}`}
          garden={single.garden}
          plantCount={single.plants.length}
          visible={menu}
          onClose={() => setMenu(false)}
          onDeleted={() => setMenu(false)}
        />
      )}
    </Screen>
  );
}

/** Plusieurs jardins : arrosages du jour (tous jardins), puis une carte par jardin. */
function GardenList({ summaries, now }: { summaries: GardenSummary[]; now: Date }) {
  const styles = useStyles();
  const { water } = useWatering();
  const todo = todoList(
    summaries.flatMap((s) => s.plants),
    now,
  );
  return (
    <>
      {todo.length > 0 && <TodoCard items={todo} onWater={water} showGarden />}
      <View style={styles.list}>
        {summaries.map((summary, i) => (
          <GardenCard
            key={summary.garden.id}
            summary={summary}
            now={now}
            delay={DELAYS[Math.min(i, DELAYS.length - 1)]!}
            onPress={() => go('gardenDetail', { id: summary.garden.id })}
          />
        ))}
      </View>
    </>
  );
}

const useStyles = makeStyles(() => ({
  content: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadTabs,
    paddingBottom: layout.bottomNavClearance,
    gap: space.xl,
  },
  list: { gap: space.m },
}));
