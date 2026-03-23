const { withAppBuildGradle } = require('@expo/config-plugins');
const appJson = require('./app.json');

module.exports = ({ config }) => {
  config = { ...appJson.expo, ...config };

  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
      'minSdkVersion 26'
    );
    return mod;
  });

  return config;
};
