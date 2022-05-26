import cron from 'node-cron';

import { checkAllBotsForPayout, unlockEgems } from '../repository';
import { STAKING_CHECK_FREQUENCY, EGEM_UNLOCK_FREQUENCY } from '../constants';

export function startCronJobs() {
  if (process.env.IS_CRON_ENABLED === 'false') return;

  console.log('CRON jobs started...');
  cron.schedule(STAKING_CHECK_FREQUENCY, checkAllBotsForPayout);
  cron.schedule(EGEM_UNLOCK_FREQUENCY, unlockEgems);
}
