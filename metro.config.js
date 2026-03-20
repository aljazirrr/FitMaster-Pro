// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-native-screens has `react-native: src/index` in package.json which causes
// metro to process TypeScript Fabric components incompatible with the @react-native/codegen
// version bundled in babel-preset-expo. We redirect to compiled lib files instead.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-screens') {
    return {
      filePath: require.resolve('react-native-screens/lib/commonjs/index'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
