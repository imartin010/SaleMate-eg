import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {RootNavigator} from '@navigation/RootNavigator';
import {ThemeProvider} from '@theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}


