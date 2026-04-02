import { User, initDb } from './models/index';

async function listUsers() {
  await initDb();
  const users = await User.findAll();
  console.log(JSON.stringify(users.map(u => ({ 
    id: u.id, 
    name: u.name, 
    email: u.email,
    role: u.role 
  })), null, 2));
}

listUsers();
