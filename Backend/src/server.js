import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`TrustLens API running on http://localhost:${config.port}`);
});
