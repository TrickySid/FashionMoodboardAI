# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose the default Cloud Run port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
