import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/ChatBubble';
import { Chip } from '@/components/Chip';
import { IconBack, IconCamera, IconSend } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { showToast } from '@/components/Toast';
import { TypingDots } from '@/components/TypingDots';
import {
  ChatError,
  createReminder,
  useChat,
  usePhotoUrls,
  useSendMessage,
  type SendInput,
} from '@/features/chat/api';
import { buildThread, type ThreadItem } from '@/features/chat/thread';
import { usePlant } from '@/features/garden/api';
import { statusOf } from '@/features/garden/gardenRules';
import { pickPlantPhoto } from '@/features/newPlant/api';
import { t, tList } from '@/i18n';
import { goBack } from '@/motion/transitions';
import { PlantAvatar } from '@/plants/PlantAvatar';
import { a11y, colors, control, layout, space, type } from '@/theme';

type Pending = SendInput & { localUri?: string };
type Failure = { kind: 'quota' | 'failed'; input: Pending };

/** Chat avec la plante (docs/04 §9). */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: plant } = usePlant(id);
  const { data: messages = [] } = useChat(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const photoPaths = messages.flatMap((m) => (m.photoPath ? [m.photoPath] : []));
  const { data: photoUrls = {} } = usePhotoUrls(photoPaths);

  const submit = (input: Pending) => {
    if (send.isPending) return;
    setFailure(null);
    setPending(input);
    send.mutate(input, {
      onSuccess: () => setPending(null),
      onError: (e) => {
        const kind = e instanceof ChatError ? e.kind : 'failed';
        const photoPath = e instanceof ChatError ? e.photoPath : undefined;
        setFailure({ kind, input: { ...input, photoPath: photoPath ?? input.photoPath } });
      },
    });
  };

  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDraft('');
    submit({ text: trimmed });
  };

  const sendPhoto = async () => {
    const photo = await pickPlantPhoto();
    if (photo) submit({ photo, localUri: photo.uri });
  };

  const remind = async (days: number) => {
    if (!plant) return;
    try {
      await createReminder(plant, days);
      showToast(t('chat.remindToast', { days }));
    } catch {
      showToast(t('toast.offline'));
    }
  };

  const name = plant?.nickname ?? '';
  const thread = buildThread(messages, name);
  // Fil inversé : le plus récent en bas, ancré au clavier.
  const items: ThreadItem[] = [...thread].reverse();

  return (
    <Screen name="chat" edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <IconButton
            accessibilityLabel={t('chat.backA11y')}
            onPress={goBack}
            icon={(c) => <IconBack color={c} />}
          />
          <View
            style={styles.avatar}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {plant && (
              <PlantAvatar
                speciesId={plant.speciesId}
                stage={statusOf(plant).stage}
                size={36}
                face="none"
                sway={false}
              />
            )}
          </View>
          <View style={styles.titles}>
            <Text
              style={styles.name}
              accessibilityRole="header"
              maxFontSizeMultiplier={a11y.maxTitleScale}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text style={styles.subtitle}>{t('chat.subtitle')}</Text>
          </View>
        </View>

        <FlatList
          inverted
          data={items}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.live}>
              {pending && <PendingBubbles pending={pending} />}
              {send.isPending && (
                <Rise>
                  <TypingDots />
                </Rise>
              )}
              {failure && <FailureBubble failure={failure} onRetry={() => submit(failure.input)} />}
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === 'date') return <Text style={styles.date}>{item.label}</Text>;
            if (item.kind === 'greeting') return <ChatBubble from="bot" text={item.text} />;
            const m = item.message;
            if (m.role === 'user') {
              return (
                <View style={styles.userGroup}>
                  {m.photoPath && <ChatBubble from="photo" uri={photoUrls[m.photoPath]} />}
                  {m.content && <ChatBubble from="me" text={m.content} />}
                </View>
              );
            }
            const action = m.actions[0];
            return (
              <ChatBubble
                from="bot"
                text={m.content ?? ''}
                action={
                  action ? { label: action.label, onPress: () => remind(action.days) } : undefined
                }
              />
            );
          }}
          ItemSeparatorComponent={Gap}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestions}
          keyboardShouldPersistTaps="handled"
        >
          {tList('chat.suggestions').map((s) => (
            <Chip key={s} label={s} variant="suggestion" onPress={() => sendText(s)} />
          ))}
        </ScrollView>

        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 30) }]}>
          <IconButton
            variant="sage"
            accessibilityLabel={t('chat.photoA11y')}
            onPress={() => void sendPhoto()}
            disabled={send.isPending}
            icon={(c) => <IconCamera color={c} />}
          />
          <View style={styles.field}>
            <TextField
              variant="chat"
              testID="chat-input"
              value={draft}
              onChangeText={setDraft}
              accessibilityLabel={t('chat.inputA11y')}
              placeholder={t('chat.placeholder')}
              returnKeyType="send"
              onSubmitEditing={() => sendText(draft)}
              submitBehavior="submit"
              maxLength={1000}
            />
          </View>
          <IconButton
            variant="forest"
            accessibilityLabel={t('chat.sendA11y')}
            onPress={() => sendText(draft)}
            disabled={send.isPending || !draft.trim()}
            icon={(c) => <IconSend color={c} />}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const Gap = () => <View style={styles.gap} />;

/** Message en cours d'envoi (affiché tout de suite). */
function PendingBubbles({ pending }: { pending: Pending }) {
  return (
    <View style={styles.userGroup}>
      {(pending.localUri || pending.photoPath) && (
        <ChatBubble from="photo" uri={pending.localUri} />
      )}
      {pending.text && <ChatBubble from="me" text={pending.text} />}
    </View>
  );
}

/** Erreur (non maquettée) : bulle assistant + « Réessayer » ; quota : message seul. */
function FailureBubble({ failure, onRetry }: { failure: Failure; onRetry: () => void }) {
  if (failure.kind === 'quota') return <ChatBubble from="bot" text={t('chat.quota')} />;
  return (
    <ChatBubble
      from="bot"
      text={t('chat.error')}
      action={{ label: t('chat.retry'), onPress: onRetry }}
    />
  );
}

const AVATAR = control.roundIcon;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingTop: space.xs,
    paddingHorizontal: layout.screenPadDetail,
    paddingBottom: space.ml,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  titles: { flex: 1 },
  name: { ...type.cardTitle, fontFamily: type.button.fontFamily, color: colors.forest },
  subtitle: { ...type.caption, color: colors.inkMuted },
  thread: { padding: layout.screenPadDetail },
  live: { gap: space.m, paddingTop: space.m },
  gap: { height: space.m },
  userGroup: { gap: space.m, alignItems: 'flex-end' },
  date: { ...type.micro, color: colors.inkMuted, textAlign: 'center' },
  suggestionsScroll: { flexGrow: 0 },
  suggestions: {
    paddingHorizontal: layout.screenPadDetail,
    paddingBottom: space.sm,
    gap: space.s,
  },
  inputRow: {
    paddingTop: space.s,
    paddingHorizontal: space.ml,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  field: { flex: 1 },
});
