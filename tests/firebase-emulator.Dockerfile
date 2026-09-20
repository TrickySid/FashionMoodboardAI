FROM node:22-bookworm-slim AS node-runtime

FROM eclipse-temurin:21-jre

COPY --from=node-runtime /usr/local/ /usr/local/

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY firebase.json firestore.rules storage.rules firestore.indexes.json ./
COPY tests/rules ./tests/rules

EXPOSE 8085 9099 9199

CMD ["npx", "firebase", "emulators:start", "--project", "demo-fashion-moodboard", "--only", "auth,firestore,storage"]
