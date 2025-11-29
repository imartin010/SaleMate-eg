import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Screen} from '@components/common/Screen';
import {useTheme} from '@theme/ThemeProvider';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {CheckoutScreenParams} from './CheckoutScreen';

export type ShopStackParamList = {
  ShopList: undefined;
  Checkout: CheckoutScreenParams;
};

type Props = NativeStackScreenProps<ShopStackParamList, 'ShopList'>;

const mockProjects = [
  {
    id: 'p1',
    name: 'New Capital Towers',
    area: 'New Administrative Capital',
    minLeads: 30,
    pricePerLead: 120,
  },
  {
    id: 'p2',
    name: 'North Coast Villas',
    area: 'North Coast',
    minLeads: 30,
    pricePerLead: 150,
  },
];

export const ShopListScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();

  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.text}]}>Shop</Text>
      <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
        Buy exclusive leads from top Egyptian projects.
      </Text>

      <FlatList
        data={mockProjects}
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingTop: 8}}
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
              navigation.navigate('Checkout', {
                projectId: item.id,
                name: item.name,
                area: item.area,
                minLeads: item.minLeads,
                pricePerLead: item.pricePerLead,
              })
            }>
            <Text style={[styles.projectName, {color: theme.colors.text}]}>
              {item.name}
            </Text>
            <Text style={[styles.projectArea, {color: theme.colors.muted}]}>
              {item.area}
            </Text>
            <Text style={[styles.tag, {color: theme.colors.primary}]}>
              Min {item.minLeads} leads • {item.pricePerLead} EGP/lead
            </Text>
          </TouchableOpacity>
        )}
      />
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
    fontSize: 13,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  projectArea: {
    fontSize: 13,
    marginTop: 2,
  },
  tag: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});


