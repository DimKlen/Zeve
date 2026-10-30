import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AddedBadge } from '@/components/AddedBadge';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChatBubble } from '@/components/ChatBubble';
import { Chip } from '@/components/Chip';
import { GrowthSteps } from '@/components/GrowthSteps';
import {
  IconAir,
  IconBack,
  IconCamera,
  IconDrop,
  IconMore,
  IconPlus,
  IconSend,
  IconSun,
} from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { InfoTile } from '@/components/InfoTile';
import { LightOption } from '@/components/LightOption';
import { ProviderButton } from '@/components/ProviderButton';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Spinner } from '@/components/Spinner';
import { TextButton } from '@/components/TextButton';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { Toggle } from '@/components/Toggle';
import { TypingDots } from '@/components/TypingDots';
import { WaterGauge } from '@/components/WaterGauge';
import { t, tList } from '@/i18n';
import { goBack } from '@/motion/transitions';
import type { Stage } from '@/plants/drawPlant';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { CATEGORIES } from '@/plants/careInfo';
import { colors, layout, space, type } from '@/theme';

// Page « kitchen sink » (Phase 1) : chaque composant dans tous ses états, pour la comparaison visuelle.
const ROOMS = ['Salon', 'Chambre', 'Cuisine'];
const LIGHTS = [
  { id: 'ombre', label: t('newPlant.lightShade'), hint: t('newPlant.lightShadeHint') },
  { id: 'indirect', label: t('newPlant.lightBright'), hint: t('newPlant.lightBrightHint') },
  { id: 'soleil', label: t('newPlant.lightSun'), hint: t('newPlant.lightSunHint') },
];

export default function DevKitchenScreen() {
  const reduced = useReducedMotion();
  const [thirsty, setThirsty] = useState(true);
  const [stage, setStage] = useState<Stage>(3);
  const [drops, setDrops] = useState(0);
  const [reminders, setReminders] = useState(true);
  const [category, setCategory] = useState('all');
  const [room, setRoom] = useState(ROOMS[0]!);
  const [light, setLight] = useState('indirect');
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(false);

  const water = () => {
    setThirsty(false);
    setDrops((n) => n + 1);
    showToast(t('plant.thanksToast', { name: 'Gaston' }));
  };

  return (
    <Screen name="devKitchen">
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={t('dev.kitchenTitle')}
          onBack={goBack}
          backLabel={t('plant.backA11y')}
        />
        {reduced && <Text style={styles.note}>{t('dev.reducedMotion')}</Text>}

        <Section title={t('dev.sectionMascot')}>
          <View style={styles.mascotRow}>
            <PlantAvatar
              key={drops}
              speciesId="monstera"
              stage={stage}
              thirsty={thirsty}
              size={160}
              face="full"
              bob
              showDrops={drops > 0}
            />
          </View>
          <View style={styles.wrap}>
            {([1, 2, 3] as const).map((s) => (
              <Chip
                key={s}
                label={t(`stage.${s}`)}
                selected={stage === s}
                onPress={() => setStage(s)}
              />
            ))}
            <Chip
              label={t('dev.thirsty')}
              selected={thirsty}
              onPress={() => setThirsty((v) => !v)}
            />
          </View>
          <View style={styles.trio}>
            <PlantAvatar speciesId="pothos" stage={3} size={80} face="simple" bob />
            <PlantAvatar
              speciesId="echinopsis"
              stage={2}
              size={120}
              face="full"
              bob
              bobDelayMs={1100}
            />
            <PlantAvatar
              speciesId="lavande"
              stage={3}
              size={80}
              face="simple"
              bob
              bobDelayMs={2200}
            />
          </View>
        </Section>

        <Section title={t('dev.sectionButtons')}>
          <Button
            label={t('newPlant.add')}
            icon={(c) => <IconPlus size={20} color={c} />}
            loading={loading}
            onPress={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          />
          <Button
            label={t('newPlant.addDisabled')}
            disabled
            icon={(c) => <IconPlus size={20} color={c} />}
          />
          <Button
            label={thirsty ? t('plant.wateredBtn') : t('plant.undoBtn')}
            variant={thirsty ? 'sun' : 'sage'}
            size="water"
            popKey={thirsty ? 'todo' : 'done'}
            icon={(c) => <IconDrop size={20} color={c} />}
            onPress={thirsty ? water : () => setThirsty(true)}
          />
          <Button label={t('added.seePlant')} variant="sun" />
          <View style={styles.wrap}>
            <Button label={t('garden.watered')} size="s" onPress={water} />
            <Button label={t('chat.remindAction', { days: 3 })} size="s" variant="secondary" />
          </View>
          <TextButton label={t('login.email')} underline />
          <TextButton label={t('settings.logout')} color={colors.danger} />
          <ProviderButton provider="google" />
          <ProviderButton provider="apple" />
          <View style={styles.wrap}>
            <IconButton
              accessibilityLabel={t('plant.backA11y')}
              icon={(c) => <IconBack color={c} />}
            />
            <IconButton
              accessibilityLabel={t('plant.moreA11y')}
              icon={(c) => <IconMore color={c} />}
            />
            <IconButton
              accessibilityLabel={t('garden.addA11y')}
              variant="sun"
              icon={(c) => <IconPlus color={c} />}
            />
            <IconButton
              accessibilityLabel={t('chat.photoA11y')}
              variant="sage"
              icon={(c) => <IconCamera color={c} />}
            />
            <IconButton
              accessibilityLabel={t('chat.sendA11y')}
              variant="forest"
              icon={(c) => <IconSend color={c} />}
            />
          </View>
        </Section>

        <Section title={t('dev.sectionInputs')}>
          <TextField
            label={t('newPlant.nameLabel')}
            placeholder={t('newPlant.namePlaceholder', { species: 'Monstera' })}
          />
          <TextField
            label={t('login.emailLabel')}
            variant="email"
            placeholder={t('login.emailPlaceholder')}
          />
          <TextField
            label={t('login.emailLabel')}
            variant="email"
            defaultValue="camille@"
            error={t('login.emailInvalid')}
          />
          <TextField
            variant="search"
            accessibilityLabel={t('species.searchLabel')}
            placeholder={t('species.searchPlaceholder')}
          />
          <TextField
            variant="chat"
            accessibilityLabel={t('chat.placeholder')}
            placeholder={t('chat.placeholder')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={category === c.id}
                onPress={() => setCategory(c.id)}
              />
            ))}
          </ScrollView>
          <View style={styles.wrap}>
            {ROOMS.map((r) => (
              <Chip
                key={r}
                label={r}
                variant="room"
                selected={room === r}
                onPress={() => setRoom(r)}
              />
            ))}
          </View>
          <View style={styles.wrap}>
            {tList('chat.suggestions').map((s) => (
              <Chip key={s} label={s} variant="suggestion" />
            ))}
          </View>
          <View style={styles.lights}>
            {LIGHTS.map((l) => (
              <View key={l.id} style={styles.light}>
                <LightOption
                  label={l.label}
                  hint={l.hint}
                  selected={light === l.id}
                  onPress={() => setLight(l.id)}
                />
              </View>
            ))}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('settings.reminders')}</Text>
            <Toggle
              value={reminders}
              onValueChange={setReminders}
              accessibilityLabel={t('settings.reminders')}
            />
          </View>
        </Section>

        <Section title={t('dev.sectionPlant')}>
          <View style={styles.tiles}>
            <InfoTile
              title={t('plant.water')}
              value={thirsty ? t('plant.waterDry') : t('plant.waterGood')}
            >
              <WaterGauge level={thirsty ? 0.18 : 0.92} />
            </InfoTile>
            <InfoTile title={t('plant.light')} value="Vive, indirecte">
              <IconSun />
            </InfoTile>
            <InfoTile title={t('plant.air')} value="Humide">
              <IconAir />
            </InfoTile>
          </View>
          <Card>
            <GrowthSteps stage={stage} />
          </Card>
          <AddedBadge speciesId="pothos" name="Lianne" />
        </Section>

        <Section title={t('dev.sectionChat')}>
          <ChatBubble from="me" text="Ses feuilles jaunissent, c'est grave ?" />
          <ChatBubble from="photo" caption="[Photo de la feuille]" />
          <ChatBubble
            from="bot"
            text={
              "Pas de panique ! Une feuille jaune en bas, c'est normal.\nSi plusieurs jaunissent, espace les arrosages."
            }
            action={{
              label: t('chat.remindAction', { days: 3 }),
              onPress: () => showToast(t('chat.remindToast', { days: 3 })),
            }}
          />
          <TypingDots />
        </Section>

        <Section title={t('dev.sectionFeedback')}>
          <Spinner />
          <Button
            label={t('dev.showToast')}
            variant="secondary"
            size="s"
            onPress={() => showToast(t('dev.toastDemo'))}
          />
          <Button
            label={t('dev.openSheet')}
            variant="secondary"
            size="s"
            onPress={() => setSheet(true)}
          />
        </Section>
      </ScrollView>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
        {['menuRename', 'menuRoom', 'menuInterval', 'menuHistory'].map((k) => (
          <TextButton key={k} label={t(`plant.${k}`)} onPress={() => setSheet(false)} />
        ))}
        <TextButton
          label={t('plant.menuDelete')}
          color={colors.danger}
          onPress={() => setSheet(false)}
        />
      </BottomSheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Rise style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </Rise>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.screenPadDetail,
    gap: space.x4,
    paddingBottom: layout.bottomNavClearance,
  },
  note: { ...type.caption, color: colors.warnText },
  section: { gap: space.m },
  sectionTitle: { ...type.overline, color: colors.inkMuted },
  mascotRow: { alignItems: 'center' },
  trio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: space.s },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  chips: { gap: space.s },
  lights: { flexDirection: 'row', gap: space.s },
  light: { flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { ...type.bodyS, fontFamily: type.cardTitle.fontFamily, color: colors.ink },
  tiles: { flexDirection: 'row', gap: space.sm },
});
