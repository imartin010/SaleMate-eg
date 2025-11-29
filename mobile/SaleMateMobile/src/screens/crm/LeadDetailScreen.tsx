import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Screen} from '@components/common/Screen';
import {useTheme} from '@theme/ThemeProvider';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CRMStackParamList, Lead} from './LeadsListScreen';

export type LeadDetailScreenParams = {
  leadId: string;
};

type Props = NativeStackScreenProps<CRMStackParamList, 'LeadDetail'>;

// Reuse mock data for now
const mockLead: Lead = {
  id: '1',
  name: 'Ahmed Hassan',
  phone: '+20 100 123 4567',
  project: 'New Capital Towers',
  stage: 'contacted',
};

export const LeadDetailScreen: React.FC<Props> = () => {
  const {theme} = useTheme();

  const handleCall = () => {
    Linking.openURL(`tel:${mockLead.phone}`);
  };

  const handleWhatsApp = () => {
    const phone = mockLead.phone.replace(/\s/g, '');
    Linking.openURL(`https://wa.me/${phone}`);
  };

  return (
    <Screen>
      <ScrollView>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {mockLead.name}
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
          {mockLead.project}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Contact
          </Text>
          <Text style={[styles.value, {color: theme.colors.text}]}>
            {mockLead.phone}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleCall}
              style={[
                styles.secondaryButton,
                {borderColor: theme.colors.primary},
              ]}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  {color: theme.colors.primary},
                ]}>
                Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[
                styles.secondaryButton,
                {borderColor: theme.colors.success},
              ]}>
              <Text
                style={[
                  styles.secondaryButtonText,
                  {color: theme.colors.success},
                ]}>
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});


