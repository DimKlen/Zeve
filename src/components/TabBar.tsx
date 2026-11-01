import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { duration } from '@/motion';
import { control, makeStyles, radius, shadow, space, type, useColors } from '@/theme';

import { IconSettings, IconSprout } from './icons';
import { useColorTransition } from './useColorTransition';

type TabName = 'garden' | 'settings';

const TABS: Record<TabName, { label: string; icon: (color: string) => ReactElement }> = {
  garden: { label: t('nav.garden'), icon: (c) => <IconSprout size={20} color={c} /> },
  settings: { label: t('nav.settings'), icon: (c) => <IconSettings size={20} color={c} /> },
};

/**
 * Barre de navigation flottante (docs/02 §7) : pilule forest 240×64, 2 onglets.
 * Actif : fond sun, texte forest. Elle ne s'anime pas entre les onglets (seul le contenu fait un fondu).
 */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, shadow.nav, { bottom: Math.max(24, insets.bottom + space.s) }]}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name as TabName];
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <Tab
            key={route.key}
            label={tab.label}
            icon={tab.icon}
            focused={focused}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (focused || event.defaultPrevented) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateToTab(route.key);
            }}
          />
        );
      })}
    </View>
  );
}

type TabProps = {
  label: string;
  icon: (color: string) => ReactElement;
  focused: boolean;
  onPress: () => void;
};

function Tab({ label, icon, focused, onPress }: TabProps) {
  const colors = useColors();
  const styles = useStyles();
  const bg = useColorTransition(focused ? colors.sun : colors.navBg, duration.tab);
  const fg = useColorTransition(focused ? colors.onSun : colors.onNav, duration.tab);
  const box = useAnimatedStyle(() => ({ backgroundColor: bg.value }));
  const text = useAnimatedStyle(() => ({ color: fg.value }));
  const iconColor = focused ? colors.onSun : colors.onNav;
  return (
    <Pressable
      onPress={onPress}
      style={styles.tabHit}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={[styles.tab, box]}>
        {icon(iconColor)}
        <Animated.Text style={[type.tab, text]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  bar: {
    position: 'absolute',
    alignSelf: 'center',
    width: control.navWidth,
    height: control.navHeight,
    borderRadius: radius.nav,
    backgroundColor: colors.navBg,
    padding: space.xs,
    flexDirection: 'row',
    gap: space.xs,
  },
  tabHit: { flex: 1 },
  tab: {
    flex: 1,
    height: control.navItem,
    borderRadius: control.navItem / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
  },
}));
