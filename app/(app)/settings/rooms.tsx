import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { IconPlus } from '@/components/icons';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { usePlants } from '@/features/garden/api';
import { useCreateRoom } from '@/features/newPlant/api';
import { useRooms, type Room } from '@/features/plant/api';
import { useRoomMutations } from '@/features/settings/api';
import { t } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { goBack } from '@/motion/transitions';
import { colors, layout, space, type } from '@/theme';

const NAME_MAX = 24;
const UNIQUE_VIOLATION = '23505';

const countLabel = (n: number) =>
  n === 0 ? t('rooms.plantsNone') : n === 1 ? t('rooms.plantsOne') : t('rooms.plantsMany', { n });

/** Mes pièces (non maquetté, docs/04 §10) : liste, ajout, renommage, suppression. */
export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const { data: rooms = [] } = useRooms();
  const { data: plants = [] } = usePlants();
  const [editing, setEditing] = useState<Room | 'new' | null>(null);

  return (
    <Screen name="rooms" edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader title={t('rooms.title')} onBack={goBack} backLabel={t('common.back')} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Rise delay="d1">
          {rooms.length ? (
            <SettingsCard>
              {rooms.map((room, i) => (
                <SettingsRow
                  key={room.id}
                  label={room.name}
                  value={countLabel(plants.filter((p) => p.roomId === room.id).length)}
                  chevron
                  last={i === rooms.length - 1}
                  onPress={() => setEditing(room)}
                />
              ))}
            </SettingsCard>
          ) : (
            <Text style={styles.empty}>{t('rooms.empty')}</Text>
          )}
        </Rise>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.x5) }]}>
        <Button
          label={t('rooms.add')}
          icon={(c) => <IconPlus size={20} color={c} strokeWidth={2.4} />}
          onPress={() => setEditing('new')}
        />
      </View>
      <RoomSheet
        key={editing === 'new' ? 'new' : (editing?.id ?? 'none')}
        room={editing}
        position={rooms.length}
        onClose={() => setEditing(null)}
      />
    </Screen>
  );
}

/** Feuille : créer, renommer ou supprimer une pièce. */
function RoomSheet({
  room,
  position,
  onClose,
}: {
  room: Room | 'new' | null;
  position: number;
  onClose: () => void;
}) {
  const isNew = room === 'new';
  const [name, setName] = useState(room && room !== 'new' ? room.name : '');
  const [error, setError] = useState<string | undefined>();
  const create = useCreateRoom();
  const { rename, remove } = useRoomMutations();
  const busy = create.isPending || rename.isPending || remove.isPending;

  const onError = (e: unknown) => {
    if ((e as { code?: string }).code === UNIQUE_VIOLATION) setError(t('rooms.exists'));
    else showToast(t('toast.offline'));
  };
  const save = () => {
    if (!name.trim() || !room) return;
    if (isNew) create.mutate({ name, position }, { onSuccess: onClose, onError });
    else rename.mutate({ id: room.id, name }, { onSuccess: onClose, onError });
  };
  const del = async () => {
    if (!room || isNew) return;
    const ok = await confirm({
      title: t('rooms.deleteConfirm', { name: room.name }),
      confirmLabel: t('rooms.delete'),
    });
    if (ok) remove.mutate(room.id, { onSuccess: onClose, onError });
  };

  return (
    <BottomSheet visible={room !== null} onClose={onClose}>
      <View style={styles.sheet}>
        <TextField
          label={t('rooms.nameLabel')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError(undefined);
          }}
          placeholder={t('newPlant.newRoomPlaceholder')}
          maxLength={NAME_MAX}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          error={error}
        />
        <Button
          label={isNew ? t('rooms.add') : t('common.save')}
          disabled={!name.trim()}
          loading={create.isPending || rename.isPending}
          onPress={save}
        />
        {!isNew && (
          <SettingsRow
            label={t('rooms.delete')}
            danger
            last
            onPress={busy ? undefined : () => void del()}
          />
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.xs, paddingHorizontal: layout.screenPadDetail },
  content: { padding: layout.screenPadDetail },
  empty: { ...type.small, color: colors.inkMuted, textAlign: 'center', marginTop: space.x5 },
  footer: { paddingTop: space.sm, paddingHorizontal: layout.screenPadDetail },
  sheet: { gap: space.m },
});
