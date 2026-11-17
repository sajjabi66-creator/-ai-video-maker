import { useState } from 'react';

// In dev the Vite server (5173) talks to Bun (4000); in production both are the same origin.
const API = import.meta.env.DEV ? 'http://localhost:4000' : '';

function App() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const generateVideo = async () => {
    if (!script.trim()) return alert('Please enter a script!');

    setLoading(true);
    setError(false);
    setVideoUrl('');
    setStatus('Generating voiceover and rendering video... this takes about 1-2 minutes.');

    try {
      const response = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script }),
      });
      const data = await response.json();

      if (data.success) {
        setStatus('✅ Video generated! Watch it below or download it.');
        setVideoUrl(`${API}${data.videoUrl}`);
      } else {
        setError(true);
        setStatus('❌ ' + (data.error || 'Something went wrong.'));
      }
    } catch (err) {
      setError(true);
      setStatus('❌ Failed to reach the server. Please try again.');
    }
    setLoading(false);
  };

  const textArea = {
    width: '100%',
    maxWidth: '700px',
    height: '150px',
    padding: '15px',
    fontSize: '16px',
    borderRadius: '10px',
    backgroundColor: '#1e293b',
    color: 'white',
    border: '1px solid #334155',
    marginTop: '20px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '50px 20px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ margin: 0 }}>🎬 AI Video Generator</h1>
      <p style={{ color: '#94a3b8', textAlign: 'center' }}>Type your script. The AI will voice it and render a video.</p>

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Type your video script here..."
        style={textArea}
      />

      <button
        onClick={generateVideo}
        disabled={loading}
        style={{ marginTop: '20px', padding: '15px 40px', fontSize: '18px', backgroundColor: loading ? '#475569' : '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Rendering...' : 'Generate Video 🚀'}
      </button>

      {status && (
        <p style={{ marginTop: '20px', fontSize: '18px', color: error ? '#ef4444' : '#22c55e', textAlign: 'center', maxWidth: '700px' }}>
          {status}
        </p>
      )}

      {videoUrl && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <video src={videoUrl} controls style={{ width: '100%', maxWidth: '700px', borderRadius: '12px' }} />
          <a
            href={videoUrl}
            download
            style={{ padding: '12px 28px', backgroundColor: '#22c55e', color: '#04121a', fontWeight: 'bold', borderRadius: '10px', textDecoration: 'none' }}
          >
            ⬇ Download video
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
