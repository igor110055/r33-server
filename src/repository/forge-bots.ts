import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { ForgeBot, SetForgeBotStakedArgs } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'forgebots';

export async function addForgeBot(forgeBot: Omit<ForgeBot, 'created_at'>) {
  const { data, error } = await supabase.from<ForgeBot>(DATABASE_TABLE_NAME).insert([
    {
      ...forgeBot,
      last_updated: new Date(),
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new ForgeBot to DB: ${error.message}`);
  }

  return data;
}

export async function setForgeBotStaked({
  forgeBotMintAddress,
  walletAddress,
  linkedCompanionAddress,
}: SetForgeBotStakedArgs) {
  const fbData = await updateForgeBot(forgeBotMintAddress, {
    owner_wallet_address: walletAddress,
    is_staked: true,
    linked_companion: linkedCompanionAddress ? linkedCompanionAddress : null,
    last_updated: new Date(),
  });

  return fbData;
}

export async function setForgeBotUnstaked(mintAddress) {
  const fbData = await updateForgeBot(mintAddress, {
    is_staked: false,
    linked_companion: null,
    last_updated: new Date(),
  });

  return fbData;
}

export async function updateForgeBot(
  mintAddress: string,
  forgeBotUpdatedFields: Partial<ForgeBot>
) {
  const { data, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .update({
      ...forgeBotUpdatedFields,
      last_updated: new Date(),
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

export async function getForgeBotById(mintAddress: string) {
  const { data: forgeBotData, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('mint_address', mintAddress);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving ForgeBot by Mint Address DB: ${error.message} `);
  }

  return forgeBotData[0];
}
