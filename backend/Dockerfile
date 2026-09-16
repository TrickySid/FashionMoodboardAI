FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --chown=node:node . .

USER node
EXPOSE 8080

CMD ["node", "server.js"]
