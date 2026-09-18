# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng Docker cache
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build project
RUN npm run build


# =========================
# Stage 2: Run
# =========================
FROM nginx:alpine

# Xóa nginx config mặc định
RUN rm /etc/nginx/conf.d/default.conf

# Copy config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy file build
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở port 80
EXPOSE 80

# Chạy nginx
CMD ["nginx", "-g", "daemon off;"]