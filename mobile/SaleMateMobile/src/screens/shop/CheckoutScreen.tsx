import React, {useMemo, useState} from 'react';
import {Screen} from '@components/common/Screen';
import {useTheme} from '@theme/ThemeProvider';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ShopStackParamList} from './ShopListScreen';

export type CheckoutScreenParams = {
  projectId: string;
  name: string;
  area: string;
  minLeads: number;
  pricePerLead: number;
};

type Props = NativeStackScreenProps<ShopStackParamList, 'Checkout'>;

export const CheckoutScreen: React.FC<Props> = ({route, navigation}) => {
  const {theme} = useTheme();
  const {name, area, minLeads, pricePerLead} = route.params;
  const [quantity, setQuantity] = useState(String(minLeads));
  const [method, setMethod] = useState<'instapay' | 'vodafone' | 'bank'>(
    'instapay',
  );

  const totalPrice = useMemo(() => {
    const qty = Number(quantity) || 0;
    return qty * pricePerLead;
  }, [quantity, pricePerLead]);

  const handleConfirm = () => {
    // For v1 we just simulate success
    Alert.alert(
      'Order placed',
      `You purchased ${quantity} leads for ${name}.`,
      [
        {
          text: 'Go to CRM',
          onPress: () => navigation.navigate('ShopList'),
        },
      ],
    );
  };

  const quantityNumber = Number(quantity) || 0;
  const disabled = quantityNumber < minLeads;

  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.text}]}>Checkout</Text>
      <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
        {name} • {area}
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <Text style={[styles.label, {color: theme.colors.text}]}>
          Quantity (min {minLeads})
        </Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
        />

        <Text style={[styles.label, {color: theme.colors.text}]}>
          Payment method
        </Text>
        <View style={styles.methodRow}>
          {(['instapay', 'vodafone', 'bank'] as const).map(value => {
            const isActive = method === value;
            const label =
              value === 'instapay'
                ? 'Instapay'
                : value === 'vodafone'
                ? 'Vodafone Cash'
                : 'Bank Transfer';
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setMethod(value)}
                style={[
                  styles.methodButton,
                  {
                    borderColor: isActive
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: isActive
                      ? theme.colors.primary + '20'
                      : 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.methodText,
                    {
                      color: isActive
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.totalLabel, {color: theme.colors.muted}]}>
          Total
        </Text>
        <Text style={[styles.totalValue, {color: theme.colors.text}]}>
          {totalPrice.toLocaleString('en-EG')} EGP
        </Text>

        <TouchableOpacity
          disabled={disabled}
          onPress={handleConfirm}
          style={[
            styles.confirmButton,
            {
              backgroundColor: disabled
                ? theme.colors.muted
                : theme.colors.primary,
            },
          ]}>
          <Text style={styles.confirmText}>Confirm purchase</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  label: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  methodButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  methodText: {
    fontSize: 13,
  },
  totalLabel: {
    marginTop: 8,
    fontSize: 13,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});


