FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY *.mjs ./
RUN chmod -R a+rX /app && chmod -R go-w /app
USER node
EXPOSE 8788
CMD ["node","index.mjs"]
