# AUC Research Assistant Mobile App

A React Native mobile application that provides AI-powered research assistance, integrating with the AUC Research Assistant backend API.

## Features

- 🔍 **AI-Powered Research Queries**: Ask research questions and get intelligent responses
- 📚 **Academic Document Search**: Search across multiple academic databases
- 📖 **Markdown Response Rendering**: Beautiful formatting for AI responses
- 📋 **Citation Generation**: Automatic APA and MLA citation formatting
- 📱 **Mobile-Optimized UI**: Native mobile experience with React Native Paper
- 🔄 **Real-time Streaming**: Live updates during query processing
- 📤 **Document Sharing**: Share research papers and citations
- 🎨 **Modern Design**: Clean, intuitive interface with Material Design

## Prerequisites

Before running the mobile app, ensure you have:

1. **Node.js** (v16 or higher)
2. **React Native CLI** or **Expo CLI**
3. **Android Studio** (for Android development)
4. **Xcode** (for iOS development, macOS only)
5. **Backend API** running (see backend setup)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd AUC-Research-Assistant/mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

## Configuration

### API Configuration

The app is configured to connect to the backend API at `http://127.0.0.1:8000`. To change this:

1. Edit `src/services/api.ts`
2. Update the `API_BASE_URL` constant
3. For production, use your deployed backend URL

### Environment Variables

Create a `.env` file in the mobile directory:

```env
API_BASE_URL=http://127.0.0.1:8000
ENVIRONMENT=development
```

## Running the App

### Android

1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **Run on Android device/emulator**:
   ```bash
   npm run android
   ```

### iOS (macOS only)

1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **Run on iOS simulator**:
   ```bash
   npm run ios
   ```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── SearchBar.tsx    # Search input component
│   │   └── DocumentCard.tsx # Document display card
│   ├── screens/             # App screens
│   │   └── SearchScreen.tsx # Main search interface
│   ├── services/            # API and external services
│   │   └── api.ts          # Backend API integration
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared types
│   ├── utils/              # Utility functions
│   │   └── citation.ts     # Citation formatting
│   └── App.tsx             # Main app component
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro bundler configuration
└── README.md              # This file
```

## Key Components

### SearchScreen
The main interface that handles:
- User query input
- Real-time streaming responses
- Document display and management
- Citation style switching
- Error handling and loading states

### SearchBar
A custom search input component with:
- Loading states
- Submit on enter
- Search icon integration
- Modern Material Design styling

### DocumentCard
Displays individual research documents with:
- Title, authors, year, source
- Relevance score
- Abstract preview
- Citation generation
- Share functionality
- External link opening

### API Service
Handles all backend communication:
- Query processing with streaming
- Document retrieval
- Health checks
- Error handling

## API Integration

The mobile app integrates with the following backend endpoints:

- `POST /api/v1/query/stream` - Streaming query processing
- `POST /api/v1/query/` - Non-streaming query processing
- `GET /api/v1/query/health` - Service health check
- `GET /api/v1/search/databases/status` - Database status
- `POST /api/v1/search/search_arxiv` - ArXiv search

## Development

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **New Screens**: Add to `src/screens/`
3. **New Services**: Add to `src/services/`
4. **New Types**: Add to `src/types/`

### Styling

The app uses:
- **React Native Paper** for Material Design components
- **StyleSheet** for component-specific styles
- **Theme provider** for consistent theming

### Testing

Run tests with:
```bash
npm test
```

### Linting

Check code quality with:
```bash
npm run lint
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npm start -- --reset-cache
   ```

2. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build issues**:
   ```bash
   cd ios && pod deintegrate && pod install && cd ..
   ```

4. **API connection issues**:
   - Ensure backend is running
   - Check API_BASE_URL configuration
   - Verify network connectivity

### Debug Mode

Enable debug mode by setting `__DEV__` to true in the app configuration.

## Deployment

### Android

1. **Generate signed APK**:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

2. **Generate AAB for Play Store**:
   ```bash
   cd android && ./gradlew bundleRelease
   ```

### iOS

1. **Archive for App Store**:
   - Open project in Xcode
   - Select "Any iOS Device" as target
   - Product → Archive

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow React Native best practices
4. Test on both Android and iOS
5. Update documentation as needed

## License

This project is part of the AUC Research Assistant and follows the same license terms.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend documentation
3. Check React Native documentation
4. Open an issue in the repository 