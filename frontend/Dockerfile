# ---- BUILD STAGE ----
FROM node:20 AS build
WORKDIR /app

# Copy everything
COPY . .

# Accept build-time env vars
ARG VITE_API_BASE
ARG VITE_COGNITO_USER_POOL_ID
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_REGION
ARG VITE_BASE_URL

# Set them as environment variables
ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID \
    VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID \
    VITE_COGNITO_REGION=$VITE_COGNITO_REGION \
    VITE_BASE_URL=$VITE_BASE_URL

# Install deps and build
RUN npm install
RUN npm run build

# ---- SERVE STAGE ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
