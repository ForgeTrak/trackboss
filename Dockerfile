FROM node:22-alpine
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.0 /lambda-adapter /opt/extensions/lambda-adapter

ENV TZ="America/New_York"

ENV PORT=3000
ENV AWS_LWA_PORT=3000
ENV AWS_LWA_READINESS_CHECK_PATH=/api/health

# Create app directory
WORKDIR /usr/src/app

# dependencies
COPY package*.json ./

# Bundle app source
COPY . .

RUN npm install
RUN npm run build
EXPOSE ${PORT}
CMD [ "npm", "run", "server-prod" ]
