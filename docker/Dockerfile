# Node image for the compose `deploy` service (and ad-hoc `docker run` if needed).
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

CMD ["bash", "-lc", "npm run compile && tail -f /dev/null"]
