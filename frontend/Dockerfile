# Stage 1: Build frontend
FROM node:20 AS build
WORKDIR /app

# Copy everything
COPY . .

# Inject Northflank env vars into a .env file that Vite understands
# These are available because Northflank injects them as build args
RUN echo "VITE_API_BASE=$VITE_API_BASE" >> .env && \
    echo "VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID" >> .env && \
    echo "VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID" >> .env && \
    echo "VITE_COGNITO_REGION=$VITE_COGNITO_REGION" >> .env && \
    echo "VITE_BASE_URL=$VITE_BASE_URL" >> .env

RUN npm install && npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
