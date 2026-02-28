const http = require('http');

const playlist = {
  playlist: [
    {
      type: 'image',
      url: 'https://picsum.photos/seed/banner1/1920/1080',
      duration: 10,
    },
    {
      type: 'video',
      url: 'https://assets.mixkit.co/videos/6652/6652-720.mp4',
    },
    {
      type: 'image',
      url: 'https://picsum.photos/seed/banner2/1920/1080',
      duration: 5,
    },
    {
      type: 'image',
      url: 'https://picsum.photos/seed/banner3/1920/1080',
      duration: 8,
    },
  ],
};

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/playlist') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(playlist, null, 2));
    console.log(`[${new Date().toISOString()}] GET /playlist - served ${playlist.playlist.length} items`);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Playlist mock server running at http://localhost:${PORT}/playlist`);
});