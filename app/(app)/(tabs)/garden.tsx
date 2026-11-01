import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { IconPlus } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { showToast } from '@/components/Toast';
import { useProfile } from '@/features/auth/profile';
import { usePlants, useWatering } from '@/features/garden/api';
import { EmptyGarden } from '@/features/garden/EmptyGarden';
import { GardenSkeleton } from '@/features/garden/GardenSkeleton';
import {
  gardenSubtitle,
  sortGarden,
  todoList,
  type GardenPlant,
} from '@/features/garden/gardenRules';
import { PlantCard } from '@/features/garden/PlantCard';
import { TodoCard } from '@/features/garden/TodoCard';
import { useGrowthToasts } from '@/features/garden/useGrowthToasts';
import { useNewPlantDraft } from '@/features/newPlant/draftStore';
import { t } from '@/i18n';
import type { riseDelay } from '@/motion';
import { go } from '@/motion/transitions';
import { a11y, layout, makeStyles, space, type, useColors } from '@/theme';

const DELAYS: (keyof typeof riseDelay)[] = ['d1', 'd2', 'd3', 'd4'];

/** Mon jardin (docs/04 §7). */
export default function GardenScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { data: profile } = useProfile();
  const { data: plants, isError, refetch, isRefetching } = usePlants();
  const { water } = useWatering();
  const [pulled, setPulled] = useState(false);
  useGrowthToasts(plants);

  // Échec sans cache (non maquetté) : squelettes + toast ; ne jamais montrer un faux « jardin vide ».
  useEffect(() => {
    if (isError && !plants) showToast(t('toast.offline'));
  }, [isError, plants]);

  // Une seule date par rendu : toutes les cartes calculent leur état au même instant.
  const now = new Date();
  const sorted = plants ? sortGarden(plants, now) : [];
  const todo = plants ? todoList(plants, now) : [];

  const openPlant = useCallback((plant: GardenPlant) => go('plant', { id: plant.id }), []);
  // Brouillon vidé à chaque ouverture depuis le + (docs/05).
  const addPlant = () => {
    useNewPlantDraft.getState().reset();
    go('newPlant');
  };
  const name = profile?.first_name;

  return (
    <Screen name="garden" refocusEnter="fade" edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pulled && isRefetching}
            onRefresh={() => {
              setPulled(true);
              void refetch().finally(() => setPulled(false));
            }}
            tintColor={colors.forest}
            colors={[colors.forest]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text style={styles.hello}>
              {name ? t('garden.hello', { name }) : t('garden.helloNoName')}
            </Text>
            <Text
              style={styles.title}
              accessibilityRole="header"
              maxFontSizeMultiplier={a11y.maxTitleScale}
            >
              {t('garden.title')}
            </Text>
            {!!plants?.length && <Text style={styles.subtitle}>{gardenSubtitle(plants, now)}</Text>}
          </View>
          <IconButton
            variant="sun"
            accessibilityLabel={t('garden.addA11y')}
            onPress={addPlant}
            icon={(c) => <IconPlus size={22} color={c} strokeWidth={2.4} />}
          />
        </View>

        {!plants ? (
          <GardenSkeleton />
        ) : !sorted.length ? (
          <EmptyGarden onAdd={addPlant} />
        ) : (
          <>
            {todo.length > 0 && <TodoCard items={todo} onWater={water} />}
            <Text
              style={styles.section}
              accessibilityRole="header"
              maxFontSizeMultiplier={a11y.maxTitleScale}
            >
              {t('garden.allPlants')}
            </Text>
            <View style={styles.grid}>
              {pairs(sorted).map((row, r) => (
                <View key={row[0].id} style={styles.row}>
                  {row.map((plant, c) => (
                    <PlantCard
                      key={plant.id}
                      plant={plant}
                      now={now}
                      delay={DELAYS[Math.min(r * 2 + c, DELAYS.length - 1)]!}
                      onPress={openPlant}
                    />
                  ))}
                  {row.length === 1 && <View style={styles.filler} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function pairs<T>(list: T[]): [T, ...T[]][] {
  const out: [T, ...T[]][] = [];
  for (let i = 0; i < list.length; i += 2) {
    out.push(list.slice(i, i + 2) as [T, ...T[]]);
  }
  return out;
}

const useStyles = makeStyles((colors) => ({
  content: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadTabs,
    paddingBottom: layout.bottomNavClearance,
    gap: space.xl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titles: { gap: space.xxs, flexShrink: 1 },
  hello: { ...type.bodyS, fontFamily: type.cardTitle.fontFamily, color: colors.inkMuted },
  title: { ...type.title, color: colors.forest },
  subtitle: { ...type.bodyS, color: colors.inkMuted },
  section: { ...type.sectionTitle, color: colors.forest, marginTop: space.xxs },
  grid: { gap: space.m },
  row: { flexDirection: 'row', gap: space.m },
  filler: { flex: 1 },
}));
