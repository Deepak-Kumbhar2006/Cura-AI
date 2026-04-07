const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const predictRoutes = require('./routes/predictRoutes');
const alertRoutes = require('./routes/alertRoutes');
const insightRoutes = require('./routes/insightRoutes');
const chatRoutes = require('./routes/chatRoutes');

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
});

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Make io accessible to routes
app.set('io', io);

app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'cura-ai-server' }));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('doctor-message', (data) => {
    io.to(data.patientId).emit('new-message', {
      from: 'doctor',
      message: data.message,
      timestamp: new Date(),
    });
  });

  socket.on('patient-message', (data) => {
    io.to(data.doctorId).emit('new-message', {
      from: 'patient',
      message: data.message,
      timestamp: new Date(),
    });
  });

  socket.on('alert', (data) => {
    io.emit('new-alert', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('DB connection failed:', error.message);
    process.exit(1);
  });
