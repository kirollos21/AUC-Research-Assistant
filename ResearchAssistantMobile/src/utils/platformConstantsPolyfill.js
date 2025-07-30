// Polyfill for PlatformConstants to resolve TurboModule error
import { Platform, NativeModules } from 'react-native';

// Check if PlatformConstants exists in NativeModules (TurboModule)
const platformConstants = NativeModules.PlatformConstants;

// If not available, use Platform.constants as fallback
if (!platformConstants) {
  // Create a mock PlatformConstants object
  const mockPlatformConstants = {
    isTesting: false,
    reactNativeVersion: {
      major: 0,
      minor: 76,
      patch: 3,
    },
    ...Platform.constants,
  };

  // Add it to NativeModules for compatibility
  if (NativeModules) {
    NativeModules.PlatformConstants = mockPlatformConstants;
  }
}

export default platformConstants || NativeModules.PlatformConstants; 