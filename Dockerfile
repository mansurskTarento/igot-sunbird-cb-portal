FROM node:22.6.0

RUN mkdir -p /app && chown -R node:node /app
WORKDIR /app
COPY --chown=node:node . .

USER node

#RUN npm i yarn
#RUN yarn global add @angular/cli@latest

RUN yarn && yarn add moment && yarn add vis-util && npm run build --prod --build-optimizer
#RUN ng build --prod --outputPath=dist/www/en --baseHref=/ --i18nLocale=en --verbose=true
RUN npm run compress:brotli
#RUN npm run compress:gzip

WORKDIR /app/dist
COPY --chown=node:node assets/iGOT/client-assets/dist www/en/assets
RUN npm install --production --force
EXPOSE 3004

CMD [ "npm", "run", "serve:prod" ]

