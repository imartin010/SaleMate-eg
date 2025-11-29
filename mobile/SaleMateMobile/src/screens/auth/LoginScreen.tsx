import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Screen} from '@components/common/Screen';
import {PrimaryButton} from '@components/common/PrimaryButton';
import {useTheme} from '@theme/ThemeProvider';
import {useAuthStore} from '@store/authStore';

export const LoginScreen: React.FC = () => {
  const {theme} = useTheme();
  const setUser = useAuthStore(state => state.setUser);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For v1 we mimic \"quick login\" by accepting any non-empty email
  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // TODO: Integrate real Supabase auth (email/OTP) in later step
      await setUser({id: 'demo-user', email: email.trim()});
    } catch (e) {
      console.error(e);
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Welcome to SaleMate
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
            Sign in with your email to access your leads and shop for new ones.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, {color: theme.colors.text}]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize=\"none\"
            keyboardType=\"email-address\"
            placeholder=\"you@example.com\"
            placeholderTextColor={theme.colors.muted}
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.card,
              },
            ]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title=\"Continue\"
            onPress={handleLogin}
            loading={loading}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 32,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
  },
  form: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 8,
    color: '#dc2626',
    fontSize: 13,
  },
});


