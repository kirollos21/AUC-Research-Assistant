FROM node:22-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies and build
RUN npm install

# Start the Next.js production server
CMD ["npm", "run", "dev"]
