import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { PayoutTransaction } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'payout_transactions';

export type CreatePayoutArgs = {
  walletAddress: string;
  amount: number;
  txHash?: string;
};

export async function createPayoutTransaction({
  walletAddress,
  amount,
  txHash,
}: CreatePayoutArgs) {
  const { data, error } = await supabase
    .from<PayoutTransaction>(DATABASE_TABLE_NAME)
    .insert([
      {
        receiving_wallet_address: walletAddress,
        payout_amount: amount,
        status: 'incomplete',
        tx_hash: txHash,
      },
    ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Payout Transaction to DB: ${error.message}`);
  }

  return data;
}

export async function updatePayoutTransaction(
  id: number,
  args: Partial<PayoutTransaction>
) {
  const { data, error } = await supabase
    .from<PayoutTransaction>(DATABASE_TABLE_NAME)
    .update({
      ...args,
      updated_at: new Date(),
    })
    .match({ id });

  if (error) {
    console.error(error);
    throw Error(`Error updating Payout Transaction ${id} in DB: ${error.message}`);
  }

  return data;
}

export async function getPayoutTransactionById(id: number) {
  const { data: transactionData, error } = await supabase
    .from<PayoutTransaction>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('id', id);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving Transaction by ID from DB: ${error.message} `);
  }

  return transactionData[0];
}

export async function getPayoutTransactionsByWalletAddress(walletAddress: string) {
  const { data: transactionData, error } = await supabase
    .from<PayoutTransaction>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('receiving_wallet_address', walletAddress);

  if (error) {
    console.error(error);
    throw Error(
      `Error retrieving Transaction by Wallet Address ${walletAddress} from DB: ${error.message} `
    );
  }

  return transactionData;
}
