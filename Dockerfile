FROM oven/bun:1

# Python (for edge-tts) + FFmpeg (for rendering)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg ca-certificates \
 && (pip3 install --no-cache-dir --break-system-packages edge-tts \
     || pip3 install --no-cache-dir edge-tts) \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# No npm dependencies on the server side: Bun runs server.ts directly.
COPY . .

ENV PORT=4000
EXPOSE 4000

CMD ["bun", "run", "server.ts"]
