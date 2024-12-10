FROM node:18

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY ../../package*.json ./

# Install app dependencies
RUN npm install

# Copy files
COPY . .

ENV OTEL_NODE_RESOURCE_DETECTORS=env,host,os
ENV OTEL_NODE_ENABLED_INSTRUMENTATIONS=http,express,winston

# Creates a "dist" folder with the production build
RUN npm run build -- core-claims-service

# Start the server using the production build
CMD [ "node", "dist/apps/core-claims-service/main.js" ]