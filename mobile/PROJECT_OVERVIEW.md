# AUC Research Assistant Mobile App - Project Overview

## 🎯 Project Summary

The AUC Research Assistant Mobile App is a React Native application that provides a native mobile interface for the existing AUC Research Assistant backend. It enables users to perform AI-powered research queries, search academic databases, and access research documents on their mobile devices.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend Framework**: React Native 0.72.6
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: React Navigation v6
- **State Management**: React Hooks (useState, useCallback)
- **Type Safety**: TypeScript
- **Styling**: StyleSheet API
- **Markdown Rendering**: react-native-markdown-display
- **HTTP Client**: Fetch API with streaming support

### Project Structure
```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── SearchBar.tsx    # Search input with Material Design
│   │   └── DocumentCard.tsx # Document display with citations
│   ├── screens/             # App screens
│   │   └── SearchScreen.tsx # Main search interface
│   ├── services/            # API and external services
│   │   └── api.ts          # Backend API integration
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared types matching backend
│   ├── utils/              # Utility functions
│   │   └── citation.ts     # Citation formatting (APA/MLA)
│   └── App.tsx             # Main app component
├── android/                # Android-specific configuration
├── ios/                    # iOS-specific configuration
└── [config files]          # Build and dependency configuration
```

## 🔌 Backend Integration

### API Endpoints Used
The mobile app integrates with the following backend endpoints:

1. **Query Processing**:
   - `POST /api/v1/query/stream` - Streaming query processing with real-time updates
   - `POST /api/v1/query/` - Non-streaming query processing

2. **Search Functionality**:
   - `GET /api/v1/search/databases/status` - Database health check
   - `POST /api/v1/search/search_arxiv` - ArXiv-specific search

3. **Health Monitoring**:
   - `GET /api/v1/query/health` - Service health check

### Data Flow
1. **User Input**: User enters research query in SearchBar component
2. **API Request**: SearchScreen sends request to backend streaming endpoint
3. **Real-time Updates**: Backend streams status updates, documents, and AI response
4. **UI Updates**: Components update in real-time as data streams in
5. **Document Display**: Documents are displayed in cards with citations
6. **User Actions**: Users can share documents, open links, switch citation styles

## 🎨 UI/UX Design

### Design Principles
- **Material Design**: Consistent with Google's Material Design guidelines
- **Mobile-First**: Optimized for touch interactions and mobile screens
- **Accessibility**: Proper contrast ratios and touch targets
- **Responsive**: Adapts to different screen sizes and orientations

### Key Components

#### SearchBar
- Material Design text input with search icon
- Loading states with spinner
- Submit on enter key
- Disabled state when loading

#### DocumentCard
- Clean card layout with elevation
- Metadata chips (authors, year, source, score)
- Abstract preview with line limiting
- Citation generation (APA/MLA)
- Action buttons (open link, share)

#### SearchScreen
- Tabbed interface (AI Response / Documents)
- Real-time status updates
- Citation style selector
- Error handling with user-friendly messages

## 📱 Platform Support

### Android
- **Minimum SDK**: API 21 (Android 5.0)
- **Target SDK**: API 34 (Android 14)
- **Permissions**: Internet, Network State, External Storage
- **Build System**: Gradle with React Native CLI

### iOS
- **Minimum Version**: iOS 12.4
- **Target Version**: Latest iOS
- **Permissions**: Network access (configured in Info.plist)
- **Build System**: Xcode with CocoaPods

## 🔧 Development Setup

### Prerequisites
- Node.js v16+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Quick Start
```bash
# Install dependencies
npm install

# iOS (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Environment Configuration
The app uses environment variables for configuration:
- `API_BASE_URL`: Backend API endpoint (default: http://127.0.0.1:8000)
- `ENVIRONMENT`: Development/production mode

## 🚀 Key Features

### 1. AI-Powered Research Queries
- Natural language research questions
- Real-time streaming responses
- Context-aware AI analysis

### 2. Academic Document Search
- Multi-database search (ArXiv, PubMed, etc.)
- Relevance scoring and ranking
- Duplicate detection and removal

### 3. Citation Management
- Automatic citation generation
- APA and MLA format support
- Easy sharing of citations

### 4. Mobile-Optimized Experience
- Touch-friendly interface
- Offline-capable components
- Native performance

### 5. Real-time Updates
- Streaming response updates
- Live status indicators
- Progressive document loading

## 🔒 Security Considerations

### Network Security
- HTTPS enforcement for production
- Certificate pinning (can be implemented)
- Secure API key storage

### Data Privacy
- No local storage of sensitive data
- Secure document sharing
- User consent for data collection

## 📊 Performance Optimization

### React Native Best Practices
- Component memoization with useCallback
- Efficient list rendering with FlatList
- Image optimization and caching
- Bundle size optimization

### Network Optimization
- Streaming responses to reduce perceived latency
- Request caching where appropriate
- Error handling and retry logic

## 🧪 Testing Strategy

### Unit Testing
- Component testing with Jest
- API service testing
- Utility function testing

### Integration Testing
- End-to-end API integration
- Navigation flow testing
- Platform-specific testing

### Manual Testing
- Cross-platform compatibility
- Different screen sizes
- Network conditions

## 🔄 Deployment

### Android
1. Generate signed APK: `cd android && ./gradlew assembleRelease`
2. Generate AAB for Play Store: `cd android && ./gradlew bundleRelease`

### iOS
1. Archive in Xcode
2. Upload to App Store Connect
3. Configure app signing and provisioning

## 📈 Future Enhancements

### Planned Features
1. **Offline Mode**: Cache documents for offline reading
2. **Push Notifications**: Research updates and alerts
3. **User Accounts**: Personalized research history
4. **Advanced Search**: Filters and saved searches
5. **Document Annotations**: Highlighting and notes
6. **Collaboration**: Share research with teams

### Technical Improvements
1. **Performance**: React Native New Architecture
2. **Testing**: Comprehensive test coverage
3. **Analytics**: User behavior tracking
4. **Accessibility**: Enhanced screen reader support

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use React Native Paper components
3. Implement proper error handling
4. Add comprehensive documentation
5. Test on both platforms

### Code Style
- Use functional components with hooks
- Implement proper TypeScript types
- Follow React Native naming conventions
- Use consistent formatting with Prettier

## 📚 Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)

### Backend Integration
- [Backend API Documentation](../backend/README.md)
- [API Endpoints](../backend/app/api/v1/)
- [Data Models](../backend/app/schemas/)

This mobile app provides a seamless, native experience for researchers to access the powerful AI-driven research capabilities of the AUC Research Assistant backend, making academic research more accessible and efficient on mobile devices. 