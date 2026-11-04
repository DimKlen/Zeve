import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { t } from '@/i18n';
import type { riseDelay } from '@/motion';
import { go } from '@/motion/transitions';
import { useGardens } from '@/features/gardens/api';
import { PlantOptionsSheet } from '@/features/plant/PlantOptionsSheet';
import { a11y, makeStyles, space, type } from '@/theme';

import { useWatering } from './api';
import { sortGarden, todoList, type GardenPlant } from './gardenRules';
import { PlantCard } from './PlantCard';
import { TodoCard } from './TodoCard';

const DELAYS: (keyof typeof riseDelay)[] = ['d1', 'd2', 'd3', 'd4'];

/** Contenu d'un jardin (docs/04 §7) : « À arroser aujourd'hui » puis la grille des plantes. */
export function GardenPlants({ plants, now }: { plants: GardenPlant[]; now: Date }) {
  const styles = useStyles();
  const { water } = useWatering();
  const sorted = sortGarden(plants, now);
  const todo = todoList(plants, now);
  const openPlant = useCallback((plant: GardenPlant) => go('plant', { id: plant.id }), []);
  // Appui long : menu court (déplacer, supprimer), le même que le « … » de la fiche.
  const { data: gardens } = useGardens();
  const canMove = (gardens?.length ?? 0) > 1;
  const [menu, setMenu] = useState<{ plant: GardenPlant; action?: 'garden' | 'delete' } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  // Mémoïsé par le React Compiler.
  const openMenu = (plant: GardenPlant, action?: 'garden' | 'delete') => {
    if (!action) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenu({ plant, action });
    setOpen(true);
  };

  return (
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
                onMenu={openMenu}
                canMove={canMove}
              />
            ))}
            {row.length === 1 && <View style={styles.filler} />}
          </View>
        ))}
      </View>
      {menu && (
        <PlantOptionsSheet
          key={`${menu.plant.id}-${menu.action ?? 'menu'}`}
          plant={menu.plant}
          only={['garden', 'delete']}
          initialView={menu.action}
          visible={open}
          onClose={() => setOpen(false)}
          onDeleted={() => setOpen(false)}
        />
      )}
    </>
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
  section: { ...type.sectionTitle, color: colors.forest, marginTop: space.xxs },
  grid: { gap: space.m },
  row: { flexDirection: 'row', gap: space.m },
  filler: { flex: 1 },
}));
