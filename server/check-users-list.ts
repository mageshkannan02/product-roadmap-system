import { User } from './models/index.ts';

async function checkUsers() {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    console.log('--- USER LIST ---');
    users.forEach(u => console.log(`${u.id}: ${u.name} (${u.role}) - ${u.email}`));
    console.log('-----------------');
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
checkUsers();
