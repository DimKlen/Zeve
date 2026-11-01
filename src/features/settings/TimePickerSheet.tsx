import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { parseTime } from '@/features/notifications/reminderPlan';
import { t } from '@/i18n';
import { makeStyles, space, type } from '@/theme';

type Props = {
  visible: boolean;
  /** « 09:00:00 » */
  value: string;
  onClose: () => void;
  onChange: (value: string) => void;
};

const toValue = (hours: number, minutes: number) =>
  `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

const WEB_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 h → 22 h
const WEB_MINUTES = [0, 15, 30, 45];

/**
 * Heure du rappel (docs/04 §10) : sélecteur natif (dialogue Android, roue iOS dans une feuille) ;
 * sur le web, chips heures / minutes.
 */
export function TimePickerSheet({ visible, value, onClose, onChange }: Props) {
  const styles = useStyles();
  const initial = parseTime(value);
  const [draft, setDraft] = useState(() => {
    const d = new Date();
    d.setHours(initial.hours, initial.minutes, 0, 0);
    return d;
  });

  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        mode="time"
        is24Hour
        value={draft}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          onClose();
          if (event.type === 'set' && date) onChange(toValue(date.getHours(), date.getMinutes()));
        }}
      />
    );
  }

  const save = () => {
    onChange(toValue(draft.getHours(), draft.getMinutes()));
    onClose();
  };
  const set = (hours: number, minutes: number) => {
    const d = new Date(draft);
    d.setHours(hours, minutes);
    setDraft(d);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.panel}>
        <Text style={styles.label}>{t('settings.reminderTime')}</Text>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            mode="time"
            display="spinner"
            locale="fr-FR"
            value={draft}
            onChange={(_e: DateTimePickerEvent, date?: Date) => date && setDraft(date)}
          />
        ) : (
          <>
            <View style={styles.chips}>
              {WEB_HOURS.map((h) => (
                <Chip
                  key={h}
                  label={`${h} h`}
                  selected={draft.getHours() === h}
                  onPress={() => set(h, draft.getMinutes())}
                />
              ))}
            </View>
            <View style={styles.chips}>
              {WEB_MINUTES.map((m) => (
                <Chip
                  key={m}
                  label={String(m).padStart(2, '0')}
                  selected={draft.getMinutes() === m}
                  onPress={() => set(draft.getHours(), m)}
                />
              ))}
            </View>
          </>
        )}
        <Button label={t('common.save')} onPress={save} />
      </View>
    </BottomSheet>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: { gap: space.m },
  label: { ...type.label, color: colors.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
}));
