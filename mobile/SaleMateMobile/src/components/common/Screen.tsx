import React from 'react';
import {SafeAreaView, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '@theme/ThemeProvider';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Screen: React.FC<Props> = ({children, style}) => {
  const {theme} = useTheme();
  return (
    <SafeAreaView
      style={[styles.safeArea, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});


