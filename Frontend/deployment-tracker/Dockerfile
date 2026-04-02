# Stage 1: Build the React/Vite app
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Vite builds to the 'dist' folder by default
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Optional: If you use React Router, you need an Nginx config to handle SPA routing
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]