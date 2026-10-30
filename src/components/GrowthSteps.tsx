import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n';
import type { Stage } from '@/plants/drawPlant';
import { colors, radius, space, type } from '@/theme';

import { IconSprout } from './icons';

type Props = { stage: Stage };

const STEPS: { stage: Stage; icon: number }[] = [
  { stage: 1, icon: 16 },
  { stage: 2, icon: 20 },
  { stage: 3, icon: 24 },
];

/** Étapes de croissance (docs/02 §7) : actuelle forest, passée sauge, future crème bordée. */
export function GrowthSteps({ stage }: Props) {
  return (
    <View style={styles.row}>
      {STEPS.map((step) => {
        const current = step.stage === stage;
        const past = step.stage < stage;
        const bg = current ? colors.forest : past ? colors.sage : colors.bg;
        const border = current ? colors.forest : past ? colors.sage : colors.line;
        const fg = current ? colors.bg : colors.forest;
        const label = t(`stage.${step.stage}`);
        return (
          <View
            key={step.stage}
            style={[styles.step, { backgroundColor: bg, borderColor: border }]}
            accessible
            accessibilityLabel={`${label}, ${t(`stage.hint${step.stage}`)}`}
            accessibilityState={{ selected: current }}
          >
            <IconSprout size={step.icon} color={fg} />
            <Text style={[type.stepLabel, { color: fg }]}>{label}</Text>
            <Text style={styles.hint}>{t(`stage.hint${step.stage}`)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.s },
  step: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    paddingVertical: space.sm,
    paddingHorizontal: space.s,
    alignItems: 'center',
    gap: space.xs,
  },
  hint: { ...type.hint, color: colors.inkMuted },
});
