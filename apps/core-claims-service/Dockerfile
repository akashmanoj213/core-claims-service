FROM node:18

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY ../../package*.json ./

# Install app dependencies
RUN npm install

# Copy files
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build -- core-claims-service

# Start the server using the production build
CMD [ "node", "dist/apps/core-claims-service/main.js" ]