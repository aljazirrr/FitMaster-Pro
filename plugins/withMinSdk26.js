const { withGradleProperties, withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

/**
 * Forces Android minSdkVersion to 26 for Health Connect compatibility.
 * Uses three approaches for maximum reliability across EAS prebuild regeneration:
 * 1. Sets android.minSdkVersion in gradle.properties (read by expo-root-project)
 * 2. Directly patches android/app/build.gradle defaultConfig (handles any template pattern)
 * 3. Sets android:minSdkVersion="26" in AndroidManifest.xml (survives manifest merger)
 */
module.exports = function withMinSdk26(config) {
  // 1. Set in gradle.properties so expo-root-project picks it up
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

  // 2. Patch android/app/build.gradle — handle rootProject.ext reference AND hardcoded numbers
  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // Replace rootProject.ext.minSdkVersion reference
    contents = contents.replace(
      /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
      'minSdkVersion 26'
    );

    // Replace any hardcoded minSdkVersion that is less than 26
    contents = contents.replace(/minSdkVersion\s+(\d+)/g, (match, ver) =>
      parseInt(ver, 10) < 26 ? 'minSdkVersion 26' : match
    );

    mod.modResults.contents = contents;
    return mod;
  });

  // 3. Patch AndroidManifest.xml: set minSdkVersion="26" and overrideLibrary
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    // Ensure xmlns:tools is declared on root manifest element
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Ensure <uses-sdk> element exists with correct attributes
    if (!manifest['uses-sdk']) {
      manifest['uses-sdk'] = [{ $: {} }];
    }
    const usesSdk = manifest['uses-sdk'][0];
    if (!usesSdk.$) {
      usesSdk.$ = {};
    }
    usesSdk.$['android:minSdkVersion'] = '26';
    usesSdk.$['tools:overrideLibrary'] = 'androidx.health.connect.client';

    return mod;
  });

  return config;
};
