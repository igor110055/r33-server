import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { ForgeBot } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'forgebots';

export async function addForgeBot(forgeBot: Omit<ForgeBot, 'created_at'>) {
  const { data, error } = await supabase.from<ForgeBot>(DATABASE_TABLE_NAME).insert([
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

export async function updateForgeBot(
  mintAddress: string,
  forgeBotUpdatedFields: Partial<ForgeBot>
) {
  const { data, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .update({
      ...forgeBotUpdatedFields,
    })
    .match({ mint_address: mintAddress });

  if (error) {
    console.error(error);
    throw Error(`Error updating new ForgeBot to DB: ${error.message}`);
  }

  return data[0];
}

export async function addMultipleForgeBots(
  forgeBots: Array<Omit<ForgeBot, 'created_at'>>
) {
  const { data, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .insert([...forgeBots]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new ForgeBot to DB: ${error.message}`);
  }

  return data;
}
