const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const predictRoutes = require('./routes/predictRoutes');
const alertRoutes = require('./routes/alertRoutes');
const insightRoutes = require('./routes/insightRoutes');
const chatRoutes = require('./routes/chatRoutes');
const healthbotRoutes = require('./routes/healthbotRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const externalDataRoutes = require('./routes/externalDataRoutes');

dotenv.config();
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'cura-ai-server' }));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/healthbot', healthbotRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/external', externalDataRoutes);

app.use((err, _req, res, _next) => {
  if (err.message?.includes('Only PDF, JPG, PNG and WEBP files are allowed') || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10MB)' : err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('DB connection failed:', error.message);
    process.exit(1);
  });
