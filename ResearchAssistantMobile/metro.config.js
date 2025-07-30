const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle TurboModule issues
config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver.alias,
    // Provide fallback for PlatformConstants
    'PlatformConstants': require.resolve('./src/utils/platformConstantsPolyfill.js'),
  },
};

module.exports = config; 