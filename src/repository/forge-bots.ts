import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { ForgeBot } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);

export async function addForgeBot(forgeBot: Omit<ForgeBot, 'created_at'>) {
  const { data, error } = await supabase.from<ForgeBot>('forgebots').insert([
    {
      ...forgeBot,
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new ForgeBot to DB: ${error.message}`);
  }

  return data;
}
