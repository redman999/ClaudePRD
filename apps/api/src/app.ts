import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/error';
import projectsRouter from './routes/projects';
import sessionsRouter from './routes/sessions';
import exportRouter from './routes/export';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'claudeprd-api', version: '0.1.0' });
});

app.use('/api/projects', projectsRouter);
app.use('/api/projects', exportRouter);
app.use('/api/sessions', sessionsRouter);

app.use(errorHandler);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4003;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  warmUpOllama();
});

function warmUpOllama() {
  if ((process.env.LLM_PROVIDER ?? 'anthropic') !== 'ollama') return;
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL;
  if (!baseUrl || !model) return;
  console.log(`Warming up Ollama model ${model}...`);
  fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: 'user', content: 'hi' }],
      options: { num_predict: 1 },
    }),
  })
    .then(() => console.log('Ollama model warm'))
    .catch((err) => console.warn('Ollama warm-up failed (non-fatal):', err.message));
}

export default app;
