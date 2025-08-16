# 🆘 **Troubleshooting**

## Common Issues

### Backend Issues
```bash
# Module not found errors
pip install -r requirements.txt

# Database connection issues
# Check DATABASE_URL in .env file

# OpenAI API errors
# Verify OPENAI_API_KEY is set correctly
```

### Frontend Issues
```bash
# Build errors
npm run build

# TypeScript errors
npx tsc --noEmit

# API connection issues
# Check NEXT_PUBLIC_API_BASE_URL in .env.local
```

### Mobile App Issues
```bash
# Metro cache issues
npx expo start --clear

# Build errors
rm -rf node_modules && npm install

# iOS simulator issues
# Reset simulator: Device → Erase All Content and Settings

# Backend connection issues
# Ensure backend is running on http://127.0.0.1:8000
# Check CORS settings for mobile app URLs
```

### Docker Issues
```bash
# Container not starting
docker-compose logs

# Port conflicts
# Change ports in docker-compose.yml

# Volume issues
docker-compose down -v
docker-compose up -d
```
