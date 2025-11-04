# Stage 1: build Angular assets
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY .npmrc ./
RUN npm ci

# Build application
COPY . ./
RUN npm run build

# Stage 2: serve with Nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist/obrasApp/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
