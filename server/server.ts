import express from 'express';
import cors from 'cors';
import { initDb, User } from './models/index.ts';
import routes from './routes/index.ts';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use((req: any, res: any, next: any) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  app.use(express.json());
  
  // JSON Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      console.error('Bad JSON:', err.message);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    next();
  });

  // Initialize DB
  await initDb();

  // Create default admin if not exists
  const adminCount = await User.count({ where: { role: 'Admin' } });
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'Admin'
    });
  }

  // --- API Routes ---
  app.use('/api', routes);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

