import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
import { Wallet } from '../types';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_DB_KEY);

// ID is same as the NFT Address
export async function getWalletById(id: string) {
  const { data: walletData, error } = await supabase
    .from<Wallet>('wallets')
    .select('*')
    .eq('id', id);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving Wallet by ID DB: ${error.message} `);
  }

  return walletData[0];
}

export async function updateWalletById(id: string, updatedWalletData: Partial<Wallet>) {
  const { data, error } = await supabase
    .from<Wallet>('wallets')
    .update({
      ...updatedWalletData,
    })
    .match({ id });

  if (error) {
    console.error(error);
    throw Error(`Error updating Wallet Data in DB: ${error.message}`);
  }

  return data;
}

export async function addWallet(wallet: Omit<Wallet, 'created_at'>) {
  const { data, error } = await supabase.from<Wallet>('wallets').insert([
    {
      ...wallet,
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Wallet to DB: ${error.message}`);
  }

  return data;
}
