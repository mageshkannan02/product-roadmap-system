import { sequelize } from './models/index.ts';

async function fix() {
  try {
    console.log('Updating Notifications table enum...');
    // Add 'role_request' to the enum
    await sequelize.query("ALTER TABLE Notifications MODIFY COLUMN type ENUM('task_assigned', 'message', 'role_request') NOT NULL");
    console.log('Successfully updated Notifications enum!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update enum:', err);
    process.exit(1);
  }
}

fix();
