FROM node:20-slim

WORKDIR /app

COPY package.json ./
COPY client/package.json ./client/

RUN npm install --omit=dev
RUN cd client && npm install

COPY . .

RUN cd client && npm run build

EXPOSE 5000

CMD ["node", "server/index.js"]
