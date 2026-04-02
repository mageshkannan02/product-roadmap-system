import { sequelize } from '../config/db';
import { User, initUser } from './user.model';
import { Roadmap, initRoadmap } from './roadmap.model';
import { Feature, initFeature } from './feature.model';
import { Milestone, initMilestone } from './milestone.model';
import { Task, initTask } from './task.model';
import { Board, initBoard } from './board.model';
import { ActivityLog, initActivityLog } from './activityLog.model';
import { Message, initMessage } from './message.model'; // Added Message import
import { Notification, initNotification } from './notification.model';
import { RoleRequest, initRoleRequest } from './roleRequest.model';
import { Note, initNote } from './note.model';

// Initialize all models
initUser();
initRoadmap();
initFeature();
initMilestone();
initTask();
initBoard();
initActivityLog();
initMessage(); // Added Message initialization
initNotification();
initRoleRequest();
initNote();

// Define Relationships
Roadmap.hasMany(Feature, { foreignKey: 'roadmap_id', as: 'features' });
Feature.belongsTo(Roadmap, { foreignKey: 'roadmap_id' });

User.hasMany(Roadmap, { foreignKey: 'created_by', as: 'roadmaps' });
Roadmap.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Feature, { foreignKey: 'created_by', as: 'created_features' });
Feature.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Task, { foreignKey: 'created_by', as: 'created_tasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Board, { foreignKey: 'created_by', as: 'boards' });
Board.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Board.belongsToMany(User, { through: 'BoardMembers', as: 'shared_with', foreignKey: 'board_id' });
User.belongsToMany(Board, { through: 'BoardMembers', as: 'shared_boards', foreignKey: 'user_id' });

Roadmap.hasMany(Board, { foreignKey: 'roadmap_id', as: 'boards' });
Board.belongsTo(Roadmap, { foreignKey: 'roadmap_id', as: 'roadmap' });

Feature.belongsToMany(User, { through: 'FeatureAssignments', as: 'assignees', foreignKey: 'feature_id' });
User.belongsToMany(Feature, { through: 'FeatureAssignments', as: 'assigned_features', foreignKey: 'user_id' });

Roadmap.hasMany(Milestone, { foreignKey: 'roadmap_id', as: 'milestones' });
Milestone.belongsTo(Roadmap, { foreignKey: 'roadmap_id' });

Feature.hasMany(Task, { foreignKey: 'feature_id', as: 'tasks' });
Task.belongsTo(Feature, { foreignKey: 'feature_id' });

User.hasMany(Task, { foreignKey: 'assigned_user_id', as: 'assigned_tasks' }); // Changed alias from 'tasks' to 'assigned_tasks'
Task.belongsTo(User, { foreignKey: 'assigned_user_id', as: 'assignee' });

ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'user_id' });

// Message Associations
Roadmap.hasMany(Message, { foreignKey: 'roadmap_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Roadmap, { foreignKey: 'roadmap_id' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// RoadmapMembers — explicit team membership for a project
Roadmap.belongsToMany(User, { through: 'RoadmapMembers', as: 'members', foreignKey: 'roadmap_id' });
User.belongsToMany(Roadmap, { through: 'RoadmapMembers', as: 'member_of', foreignKey: 'user_id' });

// RoleRequest associations
RoleRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(RoleRequest, { foreignKey: 'user_id', as: 'role_requests' });
RoleRequest.belongsTo(User, { foreignKey: 'decided_by', as: 'decider' });

// Note Associations
User.hasMany(Note, { foreignKey: 'author_id', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

Feature.hasMany(Note, { foreignKey: 'feature_id', as: 'notes', onDelete: 'CASCADE' });
Note.belongsTo(Feature, { foreignKey: 'feature_id' });

Task.hasMany(Note, { foreignKey: 'task_id', as: 'notes', onDelete: 'CASCADE' });
Note.belongsTo(Task, { foreignKey: 'task_id' });

export const initDb = async () => {
  // Use DB_ALTER=true in .env if you need to update the schema, otherwise keep it off for fast startup
  const shouldAlter = process.env.DB_ALTER === 'true';
  await sequelize.sync({ alter: shouldAlter });
};

export {
  User,
  Roadmap,
  Feature,
  Milestone,
  Task,
  Board,
  ActivityLog,
  Message,
  Notification,
  RoleRequest,
  Note,
  sequelize
};
