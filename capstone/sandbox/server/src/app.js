import express from 'express';
import morgan from 'morgan';
import { createPod } from './kubernetes/pod.js';
import { createService } from './kubernetes/service.js';
import { v7 as uuidv7 } from 'uuid';


const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/sandbox/health', (req, res) => {
  res.status(200).json({ message: 'Sandbox api is healthy',
    status: 'ok' });
});

app.post('/api/sandbox/start', async (req, res) => {
  const sandboxId = uuidv7();

  await Promise.all([
    createPod(sandboxId),
    createService(sandboxId)
  ]);

  res.status(200).json({ message: 'Sandbox started successfully',
     sandboxId,
    previewUrl: `http://${sandboxId}.preview.localhost` });
});

export default app;