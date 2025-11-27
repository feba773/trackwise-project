const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

connectDB();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboards', require('./routes/dashboardRoutes'));
app.use('/api/classify', require('./routes/classifyRoutes'));
app.use('/api/pickups', require('./routes/pickupRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket Client connected');
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'UPDATE_LOCATION') {
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: 'LOCATION_UPDATED', pickupId: data.pickupId, location: data.location }));
          }
        });
      }
    } catch (e) { console.error('WS Error', e); }
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));