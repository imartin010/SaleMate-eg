import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {Screen} from '@components/common/Screen';
import {useTheme} from '@theme/ThemeProvider';

// Placeholder KPIs; later we can wire real Supabase analytics.
const mockKpis = [
  {label: 'Total Leads', value: '128'},
  {label: 'Active Leads', value: '47'},
  {label: 'This Month Deals', value: '9'},
  {label: 'EGP Revenue', value: '1.2M'},
];

export const DashboardScreen: React.FC = () => {
  const {theme} = useTheme();

  return (
    <Screen>
      <ScrollView>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Overview
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
          Quick snapshot of your performance.
        </Text>

        <View style={styles.kpiGrid}>
          {mockKpis.map(kpi => (
            <View
              key={kpi.label}
              style={[
                styles.kpiCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Text style={[styles.kpiLabel, {color: theme.colors.muted}]}>
                {kpi.label}
              </Text>
              <Text style={[styles.kpiValue, {color: theme.colors.text}]}>
                {kpi.value}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});


