const { withGradleProperties, withAppBuildGradle } = require('expo/config-plugins');

/**
 * Forces Android minSdkVersion to 26 for Health Connect compatibility.
 * Uses two approaches for maximum reliability:
 * 1. Sets android.minSdkVersion in gradle.properties (read by Expo version catalog)
 * 2. Directly patches android/app/build.gradle defaultConfig
 */
module.exports = function withMinSdk26(config) {
  // Set in gradle.properties so ExpoRootProject version catalog picks it up
  config = withGradleProperties(config, (mod) => {
    mod.modResults = mod.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'android.minSdkVersion')
    );
    mod.modResults.push({
      type: 'property',
      key: 'android.minSdkVersion',
      value: '26',
    });
    return mod;
  });

  // Also directly patch android/app/build.gradle as a fallback
  config = withAppBuildGradle(config, (mod) => {
    // Replace any reference to rootProject.ext.minSdkVersion with hardcoded 26
    mod.modResults.contents = mod.modResults.contents.replace(
      /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
      'minSdkVersion 26'
    );
    return mod;
  });

  return config;
};
