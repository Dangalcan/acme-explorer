FROM node:20-alpine

WORKDIR /app

ENV CYPRESS_INSTALL_BINARY=0

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4200
EXPOSE 3000

CMD ["npm", "run", "start:docker"]
