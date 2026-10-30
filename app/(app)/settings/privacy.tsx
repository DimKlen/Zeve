import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsCard, SettingsRow } from '@/components/SettingsRow';
import { showToast } from '@/components/Toast';
import { deleteMyAccount, exportMyData } from '@/features/settings/api';
import { t } from '@/i18n';
import { PRIVACY_URL } from '@/lib/config';
import { confirm } from '@/lib/confirm';
import { go, goBack } from '@/motion/transitions';
import { colors, layout, space, type } from '@/theme';

/** Confidentialité (non maquetté, docs/06 F10) : politique, export JSON, suppression du compte. */
export default function PrivacyScreen() {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null);

  const doExport = async () => {
    setBusy('export');
    try {
      await exportMyData();
      showToast(t('settings.exportReady'));
    } catch {
      showToast(t('toast.offline'));
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    const ok = await confirm({
      title: t('settings.deleteAccount'),
      message: t('settings.deleteConfirm'),
      confirmLabel: t('settings.deleteAccount'),
    });
    if (!ok) return;
    setBusy('delete');
    try {
      await deleteMyAccount();
      showToast(t('settings.deletedToast'));
      go('login', { replace: true, anim: 'back' });
    } catch {
      showToast(t('toast.offline'));
      setBusy(null);
    }
  };

  return (
    <Screen name="privacy" edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader title={t('settings.privacy')} onBack={goBack} backLabel={t('common.back')} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Rise delay="d1">
          <Text style={styles.text}>{t('settings.privacyText')}</Text>
        </Rise>
        <Rise delay="d2">
          <SettingsCard>
            <SettingsRow
              label={t('settings.privacyPolicy')}
              chevron
              onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}
            />
            <SettingsRow
              label={t('settings.exportData')}
              value={busy === 'export' ? '…' : undefined}
              chevron={busy !== 'export'}
              onPress={busy ? undefined : () => void doExport()}
            />
            <SettingsRow
              label={t('settings.deleteAccount')}
              value={busy === 'delete' ? '…' : undefined}
              danger
              last
              onPress={busy ? undefined : () => void doDelete()}
            />
          </SettingsCard>
        </Rise>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: space.xs, paddingHorizontal: layout.screenPadDetail },
  content: { padding: layout.screenPadDetail, gap: space.xl },
  text: { ...type.small, color: colors.inkMuted },
});
