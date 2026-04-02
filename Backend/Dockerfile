# Use a slim Node image to save RAM on your t3.medium
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of your backend code
COPY . .

EXPOSE 5000

# Start your express server
CMD ["node", "index.js"]