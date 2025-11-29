import React, {useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Screen} from '@components/common/Screen';
import {useTheme} from '@theme/ThemeProvider';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {LeadDetailScreenParams} from './LeadDetailScreen';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  project: string;
  stage: 'new' | 'contacted' | 'qualified' | 'converted';
};

export type CRMStackParamList = {
  LeadsList: undefined;
  LeadDetail: LeadDetailScreenParams;
};

type Props = NativeStackScreenProps<CRMStackParamList, 'LeadsList'>;

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    phone: '+20 100 123 4567',
    project: 'New Capital Towers',
    stage: 'contacted',
  },
  {
    id: '2',
    name: 'Sara Mahmoud',
    phone: '+20 102 987 6543',
    project: 'North Coast Villas',
    stage: 'new',
  },
];

export const LeadsListScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      mockLeads.filter(
        lead =>
          lead.name.toLowerCase().includes(search.toLowerCase()) ||
          lead.project.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.text}]}>My Leads</Text>
        <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
          Manage and follow up your leads.
        </Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder=\"Search by name or project\"
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.search,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() =>
              navigation.navigate('LeadDetail', {
                leadId: item.id,
              })
            }>
            <Text style={[styles.leadName, {color: theme.colors.text}]}>
              {item.name}
            </Text>
            <Text style={[styles.leadProject, {color: theme.colors.muted}]}>
              {item.project}
            </Text>
            <Text style={[styles.leadStage, {color: theme.colors.primary}]}>
              {item.stage.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
  },
  leadProject: {
    fontSize: 13,
    marginTop: 2,
  },
  leadStage: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
});


