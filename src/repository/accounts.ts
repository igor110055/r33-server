import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Account } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATA_BASE_TABLE_NAME = 'accounts';

export async function createAccount(account: Omit<Account, 'created_at'>) {
  const { data, error } = await supabase.from<Account>(DATA_BASE_TABLE_NAME).insert([
    {
      ...account,
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Account to DB: ${error.message}`);
  }

  return data;
}
