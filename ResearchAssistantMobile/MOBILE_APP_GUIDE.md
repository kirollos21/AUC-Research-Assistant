# Mobile App Implementation Guide

## Overview

This document provides a comprehensive guide to the React Native mobile application that replicates the functionality of the Academic Research Assistant web frontend.

## Architecture

The mobile app follows a clean architecture pattern with the following structure:

```
ResearchAssistantMobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── services/           # API and business logic
│   └── types/              # TypeScript type definitions
├── App.tsx                 # Main app component
├── package.json            # Dependencies and scripts
└── app.json               # Expo configuration
```

## Key Features Implemented

### 1. Search Interface
- **Real-time search**: Users can enter research queries and get instant feedback
- **Streaming responses**: AI responses are displayed in real-time as they're generated
- **Status updates**: Progress indicators show current processing stage

### 2. Document Management
- **Document display**: Academic papers are shown with metadata (title, authors, year, source)
- **Relevance scoring**: Each document shows a relevance score
- **External links**: Users can open papers in their browser

### 3. Citation System
- **Multiple formats**: Support for APA and MLA citation styles
- **Copy functionality**: One-tap citation copying to clipboard
- **Collapsible interface**: Clean, space-efficient design

### 4. Theme Support
- **Automatic switching**: Follows system dark/light mode preferences
- **Consistent styling**: Material Design components with proper theming
- **Accessibility**: High contrast and readable text in both themes

### 5. Navigation
- **Tab-based interface**: Switch between AI response and document views
- **Authentication flow**: Login and signup screens (simulated)
- **Stack navigation**: Smooth transitions between screens

## Technical Implementation

### API Integration
The mobile app connects to the same backend as the web application:

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/query/stream';

export class ApiService {
  static async searchWithStreaming(
    query: string,
    onData: (data: StreamingResponse) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<void>
}
```

### State Management
Uses React's built-in state management with hooks:
- `useState` for local component state
- `useEffect` for side effects
- `useColorScheme` for theme detection

### UI Components
Built with React Native Paper for consistent Material Design:
- Cards for content organization
- Buttons with loading states
- Text inputs with validation
- Chips for metadata display
- Activity indicators for loading states

## Dependencies

### Core Dependencies
- **React Native**: Mobile app framework
- **Expo**: Development platform and tools
- **React Native Paper**: Material Design components
- **React Navigation**: Navigation between screens

### Feature Dependencies
- **React Native Markdown Display**: Renders AI responses
- **React Native Clipboard**: Citation copying functionality
- **React Native Vector Icons**: Icon library

## Development Workflow

### 1. Setup
```bash
cd ResearchAssistantMobile
npm install
```

### 2. Development
```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### 3. Testing
- Test on both Android and iOS simulators
- Verify dark/light theme switching
- Test citation copying functionality
- Ensure proper error handling

## Backend Integration

### Requirements
- Backend server must be running on `http://127.0.0.1:8000`
- CORS must be enabled for mobile app requests
- Streaming endpoint must be accessible

### Configuration
To change the backend URL, update the `API_BASE_URL` in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://your-backend-url:port/api/v1/query/stream';
```

## Mobile-Specific Considerations

### 1. Performance
- Lazy loading of document lists
- Efficient re-rendering with React.memo
- Optimized image loading

### 2. User Experience
- Touch-friendly button sizes
- Swipe gestures for navigation
- Haptic feedback for interactions
- Offline state handling

### 3. Platform Differences
- iOS-specific styling adjustments
- Android back button handling
- Platform-specific icons and fonts

## Deployment

### Android
1. Build APK: `expo build:android`
2. Generate AAB: `expo build:android -t app-bundle`
3. Upload to Google Play Console

### iOS
1. Build IPA: `expo build:ios`
2. Upload to App Store Connect
3. Submit for review

### Web
1. Build web version: `expo build:web`
2. Deploy to hosting service

## Future Enhancements

### Planned Features
1. **Offline Support**: Cache search results for offline viewing
2. **Push Notifications**: Alert users about new research papers
3. **User Profiles**: Save search history and preferences
4. **Advanced Filters**: Filter by date, journal, author, etc.
5. **Export Functionality**: Export citations to reference managers

### Technical Improvements
1. **State Management**: Implement Redux or Zustand for complex state
2. **Testing**: Add unit and integration tests
3. **Analytics**: Track user behavior and app performance
4. **Accessibility**: Improve screen reader support
5. **Internationalization**: Support multiple languages

## Troubleshooting

### Common Issues

1. **Backend Connection**
   - Verify backend is running
   - Check network connectivity
   - Ensure CORS is configured

2. **Build Errors**
   - Clear Metro cache: `npx expo start --clear`
   - Update dependencies: `npm update`
   - Check Expo SDK compatibility

3. **Performance Issues**
   - Optimize image sizes
   - Implement virtual scrolling for large lists
   - Use React.memo for expensive components

## Conclusion

The mobile app successfully replicates the web frontend's functionality while providing a native mobile experience. The modular architecture makes it easy to maintain and extend, while the use of modern React Native patterns ensures good performance and user experience.

The app is ready for development and testing, with clear documentation and a solid foundation for future enhancements. 