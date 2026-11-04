import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';

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
import { GardenPlot } from '@/features/gardens/GardenPlot';
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

/** Partie visible du contenu défilant (pour n'animer que les jardins à l'écran). */
type Viewport = { top: number; bottom: number };

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
  const [viewport, setViewport] = useState<Viewport>({ top: 0, bottom: 0 });
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
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
        scrollEventThrottle={200}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setViewport((v) => ({ top: v.top, bottom: v.top + h }));
        }}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement } = e.nativeEvent;
          setViewport({ top: contentOffset.y, bottom: contentOffset.y + layoutMeasurement.height });
        }}
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
          <GardenList summaries={summaries} now={now} viewport={focused ? viewport : null} />
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

/** Plusieurs jardins : arrosages du jour (tous jardins), puis les jardins en carrés, 2 par ligne. */
function GardenList({
  summaries,
  now,
  viewport,
}: {
  summaries: GardenSummary[];
  now: Date;
  /** null quand l'onglet n'est pas affiché : rien ne bouge. */
  viewport: Viewport | null;
}) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { water } = useWatering();
  const [gridTop, setGridTop] = useState(0);
  const todo = todoList(
    summaries.flatMap((s) => s.plants),
    now,
  );
  const size = Math.floor((width - 2 * layout.screenPadTabs - space.l) / 2);
  // Hauteur d'une ligne : carré + nom, lieu et soif sur deux lignes au plus.
  const rowHeight = size + space.l + 76;
  return (
    <>
      {todo.length > 0 && <TodoCard items={todo} onWater={water} showGarden />}
      <View style={styles.grid} onLayout={(e) => setGridTop(e.nativeEvent.layout.y)}>
        {summaries.map((summary, i) => {
          const top = gridTop + Math.floor(i / 2) * rowHeight;
          const visible = !!viewport && top < viewport.bottom && top + size > viewport.top;
          return (
            <GardenPlot
              key={summary.garden.id}
              summary={summary}
              now={now}
              size={size}
              active={visible}
              delay={DELAYS[Math.min(i, DELAYS.length - 1)]!}
              onPress={() => go('gardenDetail', { id: summary.garden.id })}
            />
          );
        })}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.l, rowGap: space.l },
}));
