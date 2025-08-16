FROM node:22-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN npm install && npm run build

# Start the Next.js production server
CMD ["node", ".next/standalone/server.js"]
