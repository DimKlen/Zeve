import { Text, View } from 'react-native';

import { IconBack, IconMore, IconPlus } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { t } from '@/i18n';
import { a11y, makeStyles, space, type } from '@/theme';

type Props = {
  title: string;
  /** « Montréal, Canada ». */
  place?: string;
  /** « 6 plantes · 2 ont soif aujourd'hui ». */
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  onAdd: () => void;
};

/** En-tête de l'accueil et d'un jardin : titres à gauche, « … » et + à droite (docs/04 §7). */
export function GardenHeader({ title, place, subtitle, onBack, onMenu, onAdd }: Props) {
  const styles = useStyles();
  const actions = (
    <View style={styles.actions}>
      {onMenu && (
        <IconButton
          accessibilityLabel={t('gardens.menuA11y')}
          onPress={onMenu}
          icon={(c) => <IconMore color={c} />}
        />
      )}
      <IconButton
        variant="sun"
        accessibilityLabel={t('garden.addA11y')}
        onPress={onAdd}
        icon={(c) => <IconPlus size={22} color={c} strokeWidth={2.4} />}
      />
    </View>
  );
  const titles = (
    <View style={styles.titles}>
      <Text
        style={styles.title}
        accessibilityRole="header"
        maxFontSizeMultiplier={a11y.maxTitleScale}
        numberOfLines={2}
      >
        {title}
      </Text>
      {!!place && <Text style={styles.place}>{place}</Text>}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  if (onBack) {
    return (
      <View style={styles.stack}>
        <View style={styles.bar}>
          <IconButton
            accessibilityLabel={t('gardens.backA11y')}
            onPress={onBack}
            icon={(c) => <IconBack color={c} />}
          />
          {actions}
        </View>
        {titles}
      </View>
    );
  }
  return (
    <View style={styles.row}>
      {titles}
      {actions}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stack: { gap: space.m },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  titles: { gap: space.xxs, flexShrink: 1 },
  title: { ...type.title, color: colors.forest },
  place: { ...type.caption, color: colors.inkMuted },
  subtitle: { ...type.bodyS, color: colors.inkMuted },
}));
