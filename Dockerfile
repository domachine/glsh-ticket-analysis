FROM node:10.13.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app
ARG NODE_ENV
ENV NODE_ENV production
RUN npm run build

ENTRYPOINT ["/tini", "--"]
CMD ["npm", "start"]
EXPOSE 3000
