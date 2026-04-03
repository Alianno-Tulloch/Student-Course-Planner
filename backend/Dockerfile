# Use the official Node.js image
FROM node:18-alpine

# Create and set the working directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (only production if you want)
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the port your server runs on
EXPOSE 5000

# Command to start the server
CMD ["node", "src/server.js"]
