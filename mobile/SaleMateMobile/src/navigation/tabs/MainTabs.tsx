import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {DashboardScreen} from '@screens/dashboard/DashboardScreen';
import {LeadsListScreen} from '@screens/crm/LeadsListScreen';
import {ShopListScreen} from '@screens/shop/ShopListScreen';
import {SettingsScreen} from '@screens/settings/SettingsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  CRM: undefined;
  Shop: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="CRM"
        component={LeadsListScreen}
        options={{title: 'Leads'}}
      />
      <Tab.Screen name="Shop" component={ShopListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};


