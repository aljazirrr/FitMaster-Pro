const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = ({ config }) => {
  // Patch root android/build.gradle — change minSdkVersion in ext block
  config = withProjectBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      /minSdkVersion\s*=\s*\d+/g,
      'minSdkVersion = 26'
    );
    return mod;
  });

  // Patch android/app/build.gradle — cover all known patterns across RN versions
  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // Groovy: minSdkVersion rootProject.ext.minSdkVersion
    contents = contents.replace(
      /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
      'minSdkVersion 26'
    );
    // Groovy newer: minSdk rootProject.ext.minSdkVersion
    contents = contents.replace(
      /minSdk\s+rootProject\.ext\.minSdkVersion/g,
      'minSdk 26'
    );
    // Groovy literal: minSdkVersion 24
    contents = contents.replace(
      /minSdkVersion\s+24\b/g,
      'minSdkVersion 26'
    );
    // Kotlin DSL: minSdk = rootProject.extra["minSdkVersion"]
    contents = contents.replace(
      /minSdk\s*=\s*rootProject\.extra\[["']minSdkVersion["']\]\s+as\s+Int/g,
      'minSdk = 26'
    );

    mod.modResults.contents = contents;
    return mod;
  });

  return config;
};
