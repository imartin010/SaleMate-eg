import React from 'react';
import {Screen} from '@components/common/Screen';
import {useTheme} from '@theme/ThemeProvider';
import {useAuthStore} from '@store/authStore';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export const SettingsScreen: React.FC = () => {
  const {theme, toggleMode} = useTheme();
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);

  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.text}]}>Settings</Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Profile
        </Text>
        <Text style={[styles.value, {color: theme.colors.text}]}>
          {user?.email ?? 'Unknown user'}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Appearance
        </Text>
        <TouchableOpacity style={styles.row} onPress={toggleMode}>
          <Text style={[styles.value, {color: theme.colors.text}]}>
            Toggle light/dark mode
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, {borderColor: theme.colors.danger}]}
        onPress={signOut}>
        <Text style={[styles.signOutText, {color: theme.colors.danger}]}>
          Sign out
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
  },
  row: {
    paddingVertical: 4,
  },
  signOutButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});


