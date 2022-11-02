# A minimal Docker image with Node and Puppeteer
#
# Initially based upon:
# https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker

FROM node:slim
#ENV NODE_OPTIONS=--max_old_space_size=8192
# We don't need the standalone Chromium
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /app
COPY . .

RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Install Puppeteer under /node_modules so it's available system-wide
ADD package.json package-lock.json /
RUN npm install

# RUN chmod -R o+rwx node_modules/puppeteer/.local-chromium