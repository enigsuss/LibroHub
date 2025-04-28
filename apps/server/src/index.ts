import express from 'express';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// auth 관련 라우터 등록
app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Hello from Express Server!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
