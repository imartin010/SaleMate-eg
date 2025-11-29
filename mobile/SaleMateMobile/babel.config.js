module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@components': './src/components',
          '@store': './src/store',
          '@services': './src/services',
          '@theme': './src/theme',
          '@types': './src/types'
        }
      }
    ]
  ]
};


