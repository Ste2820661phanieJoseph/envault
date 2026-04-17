// Storage module exports for envault
// Each module handles a specific aspect of environment variable management
export * from './vault';        // Core vault operations
export * from './sync';         // Sync between environments
export * from './lock';         // File locking
export * from './history';      // Change history
export * from './audit';        // Audit logging
export * from './tags';         // Tagging system
export * from './snapshot';     // Point-in-time snapshots
export * from './profiles';     // Environment profiles
export * from './remote';       // Remote storage backends
export * from './templates';    // Variable templates
export * from './aliases';      // Variable aliases
export * from './hooks';        // Lifecycle hooks
export * from './sharing';      // Sharing between users
export * from './permissions';  // Access control
export * from './teams';        // Team management
export * from './envgroups';    // Environment groups
export * from './search';       // Search functionality
export * from './ignore';       // Ignore patterns
export * from './backup';       // Backup and restore
export * from './notifications'; // Change notifications
export * from './schedule';     // Scheduled operations
export * from './rollback';     // Rollback support
export * from './compare';      // Diff/compare environments
export * from './lint';         // Validation and linting
export * from './merge';        // Merge strategies
