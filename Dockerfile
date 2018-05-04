FROM node:10-alpine

LABEL org.label-schema.vcs-url="https://github.com/ajmyyra/cert-stalker"

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . /usr/src/app

CMD [ "npm", "start" ]
