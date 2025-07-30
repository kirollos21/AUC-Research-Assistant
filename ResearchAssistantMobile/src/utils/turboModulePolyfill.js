// TurboModule Polyfill to resolve PlatformConstants error
import { Platform, NativeModules } from 'react-native';

// Mock PlatformConstants object
const mockPlatformConstants = {
  isTesting: false,
  reactNativeVersion: {
    major: 0,
    minor: 76,
    patch: 3,
  },
  ...Platform.constants,
};

// Override NativeModules.PlatformConstants if it doesn't exist
if (!NativeModules.PlatformConstants) {
  NativeModules.PlatformConstants = mockPlatformConstants;
}

// Override TurboModuleRegistry.getEnforcing to handle PlatformConstants
if (global.TurboModuleRegistry) {
  const originalGetEnforcing = global.TurboModuleRegistry.getEnforcing;
  global.TurboModuleRegistry.getEnforcing = function(name) {
    if (name === 'PlatformConstants') {
      return mockPlatformConstants;
    }
    return originalGetEnforcing.call(this, name);
  };
}

// Also override requireNativeComponent if it exists
if (global.requireNativeComponent) {
  const originalRequireNativeComponent = global.requireNativeComponent;
  global.requireNativeComponent = function(name) {
    if (name === 'PlatformConstants') {
      return mockPlatformConstants;
    }
    return originalRequireNativeComponent.call(this, name);
  };
}

export default mockPlatformConstants; 