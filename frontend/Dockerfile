FROM node:20-alpine

WORKDIR /app

# Cypress runs on the host, not in this dev container — skip its binary download.
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json ./
# Use install (not ci) since the lockfile is generated on first build.
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
