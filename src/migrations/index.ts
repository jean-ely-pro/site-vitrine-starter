import * as migration_20260723_071653_initial from './20260723_071653_initial';

export const migrations = [
  {
    up: migration_20260723_071653_initial.up,
    down: migration_20260723_071653_initial.down,
    name: '20260723_071653_initial'
  },
];
