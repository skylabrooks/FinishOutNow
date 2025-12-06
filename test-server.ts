import http from 'http';

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

server.listen(3001, () => {
  console.log('Test server running on port 3001');
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => {
    process.exit(0);
  });
});
