import cron from 'node-cron';
import { checkAllBotsForPayout } from '../repository';

export function startCronJobs() {
  cron.schedule('* * * * *', checkAllBotsForPayout);
}
