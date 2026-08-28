import * as migration_20260723_071653_initial from './20260723_071653_initial';
import * as migration_20260804_212643_multi_tenant from './20260804_212643_multi_tenant';
import * as migration_20260804_232232_slug_unique_par_client from './20260804_232232_slug_unique_par_client';
import * as migration_20260806_134418_publication from './20260806_134418_publication';

export const migrations = [
  {
    up: migration_20260723_071653_initial.up,
    down: migration_20260723_071653_initial.down,
    name: '20260723_071653_initial',
  },
  {
    up: migration_20260804_212643_multi_tenant.up,
    down: migration_20260804_212643_multi_tenant.down,
    name: '20260804_212643_multi_tenant',
  },
  {
    up: migration_20260804_232232_slug_unique_par_client.up,
    down: migration_20260804_232232_slug_unique_par_client.down,
    name: '20260804_232232_slug_unique_par_client',
  },
  {
    up: migration_20260806_134418_publication.up,
    down: migration_20260806_134418_publication.down,
    name: '20260806_134418_publication'
  },
];
