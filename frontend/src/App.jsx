import { useState } from 'react';

function App() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const generateVideo = async () => {
    if (!script) return alert("Please enter a script!");
    setLoading(true);
    setStatus('Generating Voiceover and Rendering Video... Please wait.');

    try {
      const response = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script })
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus('✅ Video Generated! Check your ai-video-maker folder for output.mp4');
      } else {
        setStatus('❌ Error: ' + data.error);
      }
    } catch (err) {
      setStatus('❌ Failed to connect to server.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>🎬 AI Video Generator</h1>
      <p style={{ color: '#94a3b8' }}>Type your script. The AI will voice it and render a video.</p>

      <textarea 
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Type your video script here..."
        style={{ width: '80%', height: '150px', padding: '15px', fontSize: '16px', borderRadius: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', marginTop: '20px' }}
      />

      <button 
        onClick={generateVideo} 
        disabled={loading}
        style={{ marginTop: '20px', padding: '15px 40px', fontSize: '18px', backgroundColor: loading ? '#475569' : '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Rendering...' : 'Generate Video 🚀'}
      </button>

      {status && <p style={{ marginTop: '20px', fontSize: '18px', color: status.includes('✅') ? '#22c55e' : '#ef4444' }}>{status}</p>}
    </div>
  );
}

export default App;