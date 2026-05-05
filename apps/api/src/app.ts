import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/error';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'claudeprd-api', version: '0.1.0' });
});

app.use(errorHandler);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4003;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});

export default app;
