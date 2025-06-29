# Use official Node.js image for building
FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Use Nginx to serve static files
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
