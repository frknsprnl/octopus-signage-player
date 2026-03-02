const http = require('http');

const playlist = {
  playlist: [
    {
      type: 'video',
      url: 'https://videos.pexels.com/video-files/33909042/14390221_1920_1080_60fps.mp4',
    },
    {
      type: 'image',
      url: 'https://octopussignage.com/wp-content/uploads/2024/12/DSC01412_square.jpg',
      duration: 5,
    },
    {
      type: 'video',
      url: 'https://videos.pexels.com/video-files/5548361/5548361-uhd_2560_1440_25fps.mp4',
    },
    {
      type: 'video',
      url: 'https://videos.pexels.com/video-files/5548082/5548082-uhd_2560_1440_25fps.mp4',
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