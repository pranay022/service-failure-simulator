import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Server is running in development mode.`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});
