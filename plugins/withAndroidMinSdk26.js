const { withAppBuildGradle, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Fix 1: Patch build.gradle so minSdkVersion is hardcoded to 26.
 *
 * expo-build-properties only writes android.minSdkVersion to gradle.properties.
 * ExpoRootProjectPlugin (expo-modules-autolinking) sets rootProject.ext.minSdkVersion
 * from the Gradle version catalog (default: 24) — it does NOT read gradle.properties.
 * So the generated build.gradle would use rootProject.ext.minSdkVersion = 24 unless we
 * patch build.gradle directly.
 */
function withBuildGradleMinSdk(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    // Replace dynamic reference OR any existing hardcoded value in defaultConfig
    const patched = contents.replace(
      /(\bdefaultConfig\b[\s\S]*?\bminSdkVersion\s+)(?:rootProject\.ext\.minSdkVersion|\d+)/,
      '$126'
    );
    if (patched === contents) {
      // Fallback: replace any standalone minSdkVersion line
      config.modResults.contents = contents.replace(
        /\bminSdkVersion\s+(?:rootProject\.ext\.minSdkVersion|\d+)/,
        'minSdkVersion 26'
      );
    } else {
      config.modResults.contents = patched;
    }
    return config;
  });
}

/**
 * Fix 2: Patch settings.gradle to override the Gradle version catalog minSdk entry.
 *
 * ExpoRootProjectPlugin reads: versionCatalogs.getVersionOrDefault("minSdk", "24")
 * Adding catalog.version("minSdk", "26") inside useExpoVersionCatalog sets this to 26
 * so rootProject.ext.minSdkVersion = 26 for all subprojects.
 */
function withSettingsGradleMinSdk(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const settingsGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'settings.gradle'
      );

      if (!fs.existsSync(settingsGradlePath)) return config;

      let contents = fs.readFileSync(settingsGradlePath, 'utf8');

      if (contents.includes('catalog.version("minSdk"')) {
        // Already patched
        return config;
      }

      if (contents.includes('useExpoVersionCatalog')) {
        // Inject inside the existing block
        contents = contents.replace(
          /(expoAutolinking\.useExpoVersionCatalog\s*\{[^}]*)(})/,
          '$1  catalog.version("minSdk", "26")\n$2'
        );
      } else {
        // Append a new block after useExpoModules()
        contents = contents.replace(
          'expoAutolinking.useExpoModules()',
          'expoAutolinking.useExpoModules()\n\nexpoAutolinking.useExpoVersionCatalog { catalog ->\n  catalog.version("minSdk", "26")\n}'
        );
      }

      fs.writeFileSync(settingsGradlePath, contents);
      return config;
    },
  ]);
}

/**
 * Fix 3: Ensure AndroidManifest.xml declares minSdkVersion 26 and suppresses
 * the manifest-merger error for androidx.health.connect.client.
 */
function withManifestMinSdk(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure tools namespace is declared
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Set / replace uses-sdk element
    manifest['uses-sdk'] = [
      {
        $: {
          'android:minSdkVersion': '26',
          'tools:overrideLibrary': 'androidx.health.connect.client',
        },
      },
    ];

    return config;
  });
}

module.exports = function withAndroidMinSdk26(config) {
  config = withBuildGradleMinSdk(config);
  config = withSettingsGradleMinSdk(config);
  config = withManifestMinSdk(config);
  return config;
};
