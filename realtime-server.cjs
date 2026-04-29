const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.REALTIME_PORT || 3001);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const message = JSON.stringify({
          type: payload.type || 'app.updated',
          payload: payload.payload || {},
          ts: Date.now(),
        });

        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(message);
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      type: 'connected',
      payload: { message: 'Realtime connected' },
      ts: Date.now(),
    }),
  );
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[realtime] listening on http://localhost:${PORT}`);
});
