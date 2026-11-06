import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { PressableScale } from '@/components/PressableScale';
import { Rise } from '@/components/Rise';
import { statusOf } from '@/features/garden/gardenRules';
import { t } from '@/i18n';
import type { riseDelay } from '@/motion';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { makeStyles, radius, space, type, useColors } from '@/theme';

import { placeLabel, type GardenSummary } from './gardenRules';
import { FenceFoliage } from './FenceFoliage';
import { plotLayout } from './plotLayout';

/** Pelouse dans le repère 0..100 du dessin : la clôture l'entoure. */
const LAWN = { x: 9, size: 82 };
const RAIL = [4, 7];
const POST = 4.4;
const POSTS = [2.4, 18.6, 34.8, 51, 67.2, 83.4, 93.2];
/** Les plantes d'un jardin ne se balancent pas toutes en même temps. */
const SWAY_STAGGER_MS = 430;
/** Quelques brins d'herbe clairsemés, légers (x, y dans le repère 0..100, taille) : on voit toujours les plantes. */
const GRASS: [number, number, number][] = [
  [16, 22, 1],
  [30, 14, 0.8],
  [74, 18, 1],
  [86, 40, 0.8],
  [14, 58, 0.9],
  [62, 52, 0.8],
  [24, 82, 1],
  [48, 86, 0.8],
  [80, 80, 1],
  [88, 66, 0.7],
];
/** Un brin d'herbe : trois lames fines qui partent du même point. */
const TUFT = 'M0 0C-.6-2.4-1.8-3.8-2.8-4.6M0 0C0-3 0-4.8.4-6M0 0C.6-2.4 1.8-3.8 2.8-4.6';

export const plantsLabel = (n: number) =>
  n === 1 ? t('gardens.plantsOne') : t('gardens.plantsMany', { n });
export const thirstLabel = (n: number) =>
  n === 0
    ? t('gardens.thirstNone')
    : n === 1
      ? t('gardens.thirstOne')
      : t('gardens.thirstMany', { n });

type Props = {
  summary: GardenSummary;
  now: Date;
  /** Côté du carré, en px. */
  size: number;
  delay: keyof typeof riseDelay;
  /** Carré visible à l'écran : seules ses plantes se balancent. */
  active: boolean;
  onPress: () => void;
};

/**
 * Jardin vu comme un carré clôturé (« Mes jardins », non maquetté) : pelouse sauge, clôture en
 * bois, jusqu'à 10 plantes qui se balancent en décalé, « +N » au-delà ; nom, lieu et soif dessous.
 */
export function GardenPlot({ summary, now, size, delay, active, onPress }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const { garden, plants, thirsty } = summary;
  const place = placeLabel(garden);
  const lawn = (size * LAWN.size) / 100;
  const offset = (size * LAWN.x) / 100;
  const layout = plotLayout(plants.length);
  const plantW = Math.round(layout.width * lawn);
  return (
    <Rise delay={delay}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('gardens.cardA11y', {
          name: garden.name,
          place,
          plants: plantsLabel(plants.length),
          thirst: thirstLabel(thirsty),
        })}
        style={[styles.card, { width: size }]}
      >
        <View
          style={{ width: size, height: size }}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Rect
              x={LAWN.x}
              y={LAWN.x}
              width={LAWN.size}
              height={LAWN.size}
              rx={5}
              fill={colors.sage}
            />
            {GRASS.map(([x, y, k]) => (
              <Path
                key={`${x}-${y}`}
                d={TUFT}
                transform={`translate(${x} ${y}) scale(${k})`}
                stroke={colors.grass}
                strokeWidth={1.1}
                strokeLinecap="round"
                fill="none"
                opacity={0.55}
              />
            ))}
            {RAIL.map((inset) => (
              <Rect
                key={inset}
                x={inset}
                y={inset}
                width={100 - 2 * inset}
                height={100 - 2 * inset}
                rx={4}
                fill="none"
                stroke={colors.fence}
                strokeWidth={1.5}
              />
            ))}
            {POSTS.flatMap((a) =>
              POSTS.filter(
                (b) => a === POSTS[0] || a === POSTS.at(-1) || b === POSTS[0] || b === POSTS.at(-1),
              ).map((b) => (
                <Rect
                  key={`${a}-${b}`}
                  x={a}
                  y={b}
                  width={POST}
                  height={POST}
                  rx={1.2}
                  fill={colors.fencePost}
                />
              )),
            )}
          </Svg>
          <FenceFoliage size={size} active={active} />
          {layout.slots.map((slot) => {
            const plant = plants[slot.index]!;
            const s = statusOf(plant, now);
            return (
              <View
                key={plant.id}
                style={[
                  styles.plant,
                  {
                    left: offset + slot.x * lawn - plantW / 2,
                    top: offset + slot.y * lawn - plantW * 1.1,
                  },
                ]}
              >
                <PlantAvatar
                  speciesId={plant.speciesId}
                  stage={s.stage}
                  thirsty={s.thirsty}
                  size={plantW}
                  sway={active}
                  swayDelayMs={slot.index * SWAY_STAGGER_MS}
                />
              </View>
            );
          })}
          {layout.extra > 0 && (
            <View style={styles.more}>
              <Text style={styles.moreText}>{t('gardens.morePlants', { n: layout.extra })}</Text>
            </View>
          )}
        </View>
        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={1}>
            {garden.name}
          </Text>
          {!!place && (
            <Text style={styles.place} numberOfLines={1}>
              {place}
            </Text>
          )}
          <View style={styles.status}>
            <View
              style={[styles.dot, { backgroundColor: thirsty ? colors.thirstyDot : colors.okDot }]}
            />
            <Text style={styles.statusText} numberOfLines={2}>
              {`${plantsLabel(plants.length)} · ${thirstLabel(thirsty)}`}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Rise>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { gap: space.xs },
  plant: { position: 'absolute' },
  // Posé sur le coin de la clôture : ne cache aucune plante.
  more: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.fence,
    borderRadius: radius.chip,
    paddingHorizontal: space.s,
    paddingVertical: 2,
  },
  moreText: { ...type.badge, color: colors.inkSoft },
  texts: { gap: 2, paddingHorizontal: space.xxs },
  name: { ...type.plantName, color: colors.forest },
  place: { ...type.caption, color: colors.inkMuted },
  status: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  statusText: { ...type.caption, color: colors.ink, flexShrink: 1 },
}));
