import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { globalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFound } from './middleware/errorHandler.middleware.js';
import authRoutes from './routes/auth.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import trustCenterRoutes from './routes/trustCenter.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(globalLimiter);

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TrustLens API is running' });
});

// Apply JSON parsing only to routes that send JSON
// Analysis route uses multer for multipart/form-data — no express.json() there
app.use('/api/auth', express.json({ limit: '1mb' }), authRoutes);
app.use('/api/listings', express.json({ limit: '1mb' }), listingsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/trust-center', express.json({ limit: '1mb' }), trustCenterRoutes);

app.get("/", (req, res) => {
  res.send("TrustLens Backend Running 🚀");
});

app.use(notFound);
app.use(errorHandler);

export default app;