# Research Assistant Mobile App

A React Native mobile application that provides the same functionality as the web frontend for the Academic Research Assistant. This app allows users to search academic databases, get AI-powered research assistance, and manage citations.

## Features

- **Academic Research Search**: Search across multiple academic databases
- **AI-Powered Analysis**: Get intelligent responses based on relevant academic papers
- **Document Management**: View and organize search results
- **Citation Generation**: Generate citations in APA and MLA formats
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Responsive Design**: Optimized for mobile devices
- **Authentication**: Login and signup functionality (simulated)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository and navigate to the mobile app directory:**
   ```bash
   cd ResearchAssistantMobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## Running the App

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

### Web
```bash
npm run web
```

## Backend Configuration

The mobile app connects to the same backend as the web application. Make sure the backend server is running on `http://127.0.0.1:8000` before using the mobile app.

To change the backend URL, update the `API_BASE_URL` in `src/services/api.ts`.

## Project Structure

```
src/
├── components/
│   └── CitationPreview.tsx    # Citation generation component
├── screens/
│   ├── HomeScreen.tsx         # Main search interface
│   ├── LoginScreen.tsx        # User authentication
│   └── SignupScreen.tsx       # User registration
├── services/
│   └── api.ts                 # API communication service
└── types/
    ├── search.ts              # TypeScript type definitions
    └── react-native-clipboard.d.ts  # Type declarations
```

## Key Components

### HomeScreen
The main interface that replicates the web frontend functionality:
- Search input with real-time query processing
- Streaming response display
- Document results with metadata
- Tab navigation between AI response and documents
- Citation style selection

### CitationPreview
A collapsible component that generates citations in APA and MLA formats with copy-to-clipboard functionality.

### ApiService
Handles communication with the backend API, including:
- Streaming search requests
- Real-time response processing
- Error handling
- Health checks

## Dependencies

- **React Native Paper**: Material Design components
- **React Navigation**: Navigation between screens
- **React Native Markdown Display**: Markdown rendering for AI responses
- **React Native Clipboard**: Copy functionality for citations
- **Expo**: Development platform and tools

## Development

### Adding New Features
1. Create new components in `src/components/`
2. Add new screens in `src/screens/`
3. Update types in `src/types/`
4. Add API methods in `src/services/api.ts`

### Styling
The app uses React Native Paper for consistent Material Design styling and supports both light and dark themes automatically.

### State Management
Currently uses React's built-in state management. For more complex state, consider adding Redux or Zustand.

## Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure the backend server is running on `http://127.0.0.1:8000`
   - Check network connectivity
   - Verify CORS settings on the backend

2. **Build Errors**
   - Clear Metro cache: `npx expo start --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **iOS Simulator Issues**
   - Reset simulator: Device → Erase All Content and Settings
   - Update Xcode to latest version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both Android and iOS
5. Submit a pull request

## License

This project is licensed under the same license as the main Research Assistant project. 