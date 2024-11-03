FROM node:20-alpine3.18
ENV PORT=3000
WORKDIR /usr/src/app
ADD package*.json ./
RUN npm install
ADD . /usr/src/app
EXPOSE 3000
CMD ["npm","start"]
