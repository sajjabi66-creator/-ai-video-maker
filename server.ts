// AI Video Generator - cloud-ready server
// Bun + edge-tts + FFmpeg, serves the React build and streams the finished MP4 back.

const PORT = Number(process.env.PORT || 4000);
const BG = "background.jpg"; // one still image, looped for the whole video
// Output size: "1080x1920" = vertical Shorts/Reels, "1920x1080" = landscape.
const [VW, VH] = (process.env.VIDEO_SIZE || "1080x1920").split("x").map(Number);
const VF = `scale=${VW}:${VH}:force_original_aspect_ratio=increase,crop=${VW}:${VH},format=yuv420p`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

let busy = false; // one render at a time (free tier has little RAM)

const server = Bun.serve({
  port: PORT,
  idleTimeout: 255, // rendering can take a couple of minutes
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    // ---- 1. Generate a video -------------------------------------------
    if (req.method === "POST" && url.pathname === "/generate") {
      if (busy) return json({ success: false, error: "Server is busy rendering another video. Try again in a moment." }, 429);

      let text = "";
      try {
        const body = await req.json();
        text = String(body?.text ?? "").trim();
      } catch {
        return json({ success: false, error: "Invalid request body." }, 400);
      }

      if (!text) return json({ success: false, error: "Please enter a script." }, 400);
      if (text.length > 4000) return json({ success: false, error: "Script is too long (max 4000 characters)." }, 400);

      busy = true;
      const id = Date.now().toString();
      const audio = `audio-${id}.mp3`;
      const video = `output-${id}.mp4`;

      try {
        console.log(`[${id}] voiceover...`);
        await Bun.$`edge-tts --text ${text} --write-media ${audio} --voice en-US-ChristopherNeural`;

        console.log(`[${id}] rendering ${VW}x${VH}...`);
        await Bun.$`ffmpeg -y -loop 1 -i ${BG} -i ${audio} -vf ${VF} -r 30 -c:v libx264 -preset veryfast -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -shortest -movflags +faststart ${video}`;

        console.log(`[${id}] done`);
        return json({ success: true, videoUrl: `/video/${video}`, id });
      } catch (err) {
        console.error(`[${id}] failed:`, err);
        return json({ success: false, error: "Failed to generate video. Please try again." }, 500);
      } finally {
        try {
          await Bun.file(audio).delete();
        } catch {}
        busy = false;
      }
    }

    // ---- 2. Stream the finished video ----------------------------------
    if (req.method === "GET" && url.pathname.startsWith("/video/")) {
      const name = url.pathname.split("/").pop() || "";
      if (!/^output-\d+\.mp4$/.test(name)) return new Response("Not found", { status: 404 });

      const file = Bun.file(name);
      if (!(await file.exists())) return new Response("Not found", { status: 404 });

      return new Response(file, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `inline; filename="${name}"`,
          "Cache-Control": "no-store",
          ...cors,
        },
      });
    }

    // ---- 3. Health check ------------------------------------------------
    if (url.pathname === "/health") {
      return json({ ok: true, busy, size: `${VW}x${VH}`, background: await Bun.file(BG).exists() });
    }

    // ---- 4. Serve the React build --------------------------------------
    const rel = url.pathname === "/" ? "/index.html" : url.pathname;
    const asset = Bun.file(`./dist${rel}`);
    if (await asset.exists()) return new Response(asset);

    const index = Bun.file("./dist/index.html");
    if (await index.exists()) return new Response(index);

    return new Response("Frontend build not found. Run: cd frontend && bun run build", { status: 500 });
  },
});

console.log(`AI Video Engine running on port ${server.port}`);
