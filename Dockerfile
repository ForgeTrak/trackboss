FROM node:22-alpine
ENV TZ="America/New_York"

ENV PORT=3000
ENV MYSQL_DB=pradb

# Create app directory
WORKDIR /usr/src/app

# dependencies
COPY package*.json ./

# Bundle app source
COPY . .

RUN npm install
RUN npm run run-migrations
EXPOSE ${PORT}
CMD [ "npm", "run", "server-prod" ]
