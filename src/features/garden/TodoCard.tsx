import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { IconCheck, IconDrop } from '@/components/icons';
import { Rise } from '@/components/Rise';
import { t } from '@/i18n';
import { usePop } from '@/motion/useEnter';
import { a11y, colors, control, radius, space, type } from '@/theme';

import type { GardenPlant, TodoItem } from './gardenRules';

type Props = {
  items: TodoItem[];
  onWater: (plant: GardenPlant) => void;
  /** Couleur de fond réglable (butter par défaut, docs/02 §1). */
  accent?: string;
};

/** Carte « À arroser aujourd'hui » (docs/04 §7). */
export function TodoCard({ items, onWater, accent = colors.butter }: Props) {
  return (
    <Rise delay="d1">
      <View style={[styles.card, { backgroundColor: accent }]}>
        <View style={styles.header}>
          <IconDrop size={18} color={colors.forest} strokeWidth={2} />
          <Text
            style={styles.title}
            accessibilityRole="header"
            maxFontSizeMultiplier={a11y.maxTitleScale}
          >
            {t('garden.todoTitle')}
          </Text>
        </View>
        {items.map((item) => (
          <TodoRow key={item.plant.id} item={item} onWater={onWater} />
        ))}
      </View>
    </Rise>
  );
}

function TodoRow({ item, onWater }: { item: TodoItem; onWater: (plant: GardenPlant) => void }) {
  const { plant, done, sinceLabel } = item;
  const subtitle = plant.roomName ? `${plant.roomName} · ${sinceLabel}` : sinceLabel;
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {plant.nickname}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {done ? (
        <DoneBadge />
      ) : (
        <Button label={t('garden.watered')} size="s" onPress={() => onWater(plant)} />
      )}
    </View>
  );
}

/** « ✓ Arrosé » qui apparaît en pop. */
function DoneBadge() {
  const pop = usePop('done', true);
  return (
    <Animated.View
      style={[styles.done, pop]}
      accessible
      accessibilityLabel={t('garden.wateredDone')}
      accessibilityLiveRegion="polite"
    >
      <IconCheck size={16} color={colors.forest2} strokeWidth={2.5} />
      <Text style={styles.doneText}>{t('garden.wateredDone')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.section, padding: space.l, gap: space.m },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  title: { ...type.sectionTitle, color: colors.forest },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.todoRow,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingRight: space.sm,
    paddingLeft: space.ml,
    gap: space.s,
  },
  texts: { flex: 1 },
  name: { ...type.cardTitle, color: colors.ink },
  subtitle: { ...type.caption, color: colors.inkMuted },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: control.smallButton,
    paddingHorizontal: space.ml,
  },
  doneText: { ...type.buttonS, color: colors.forest2 },
});
