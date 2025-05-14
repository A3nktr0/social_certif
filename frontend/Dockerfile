# FROM node:22.14-bullseye-slim

# WORKDIR /app

# COPY package*.json ./
# # To allow images
# # COPY next.config.ts ./

# RUN npm install

# COPY . .

# # RUN npx next build

# EXPOSE 3000

# CMD ["npx", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]
# # CMD ["npx","next","start"]

FROM node:22.14-bullseye-slim

WORKDIR /app

COPY package*.json ./
# To allow images
# COPY next.config.ts ./


RUN npm install

COPY . .

# RUN npx next build

EXPOSE 3000

CMD ["npx", "next", "dev", "-H", "0.0.0.0", "-p", "3000"]
# CMD ["npx","next","start"]