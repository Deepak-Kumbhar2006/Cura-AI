const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const predictRoutes = require('./routes/predictRoutes');
const alertRoutes = require('./routes/alertRoutes');

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*'}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'cura-ai-server' }));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/predict', predictRoutes);

app.use((err, _req, res, _next) => {
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
