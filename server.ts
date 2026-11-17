const server = Bun.serve({
  port: 4000,
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
    }

    if (req.method === "POST" && new URL(req.url).pathname === "/generate") {
      const body = await req.json();
      const script = body.text;

      console.log("🎬 Generating video for script:", script.substring(0, 30) + "...");

      try {
        console.log("🎙️ Creating AI Voiceover...");
        await Bun.$`edge-tts --text ${script} --write-media audio.mp3 --voice en-US-ChristopherNeural`;

        console.log("🎞️ Rendering Video with FFmpeg...");
        await Bun.$`ffmpeg -y -loop 1 -i background.jpg -i audio.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest output.mp4`;

        console.log("✅ Video generated successfully!");
        return new Response(JSON.stringify({ success: true, message: "Video generated!" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ success: false, error: "Failed to generate video." }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("AI Video Maker Backend is Running!");
  },
});

console.log(`🚀 AI Video Engine running at http://localhost:4000`);