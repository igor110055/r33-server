import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Account } from '../types';
import { generateNewAccountObject } from '../utils';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'accounts';

export async function createAccount(walletAddress: string) {
  const tempAccount = generateNewAccountObject(walletAddress);

  const { data, error } = await supabase.from<Account>(DATABASE_TABLE_NAME).insert([
    {
      ...tempAccount,
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Account to DB: ${error.message}`);
  }

  return data;
}

export async function updateAccountEgemBalance(walletAddress: string, amount: number) {
  const account = await getAccountByWalletAddress(walletAddress);

  updateAccountByWalletAddress(walletAddress, {
    total_egems_claimed: account.total_egems_claimed + amount,
  });
}

export async function updateAccountByWalletAddress(
  walletAddress: string,
  accountUpdatedFields: Partial<Account>
) {
  const { data, error } = await supabase
    .from<Account>(DATABASE_TABLE_NAME)
    .update({
      ...accountUpdatedFields,
      updated_at: new Date(),
    })
    .match({ wallet_address: walletAddress });

  if (error) {
    console.error(error);
    throw Error(`Error updating account in DB: ${error.message}`);
  }

  return data;
}

export async function getAccountByWalletAddress(walletAddress: string) {
  const { data, error } = await supabase
    .from<Account>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('wallet_address', walletAddress);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Account to DB: ${error.message}`);
  }

  return data[0];
}
