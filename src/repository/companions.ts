import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Companion } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'companions';

export async function addCompanion(companion: Omit<Companion, 'created_at'>) {
  const { data, error } = await supabase.from<Companion>(DATABASE_TABLE_NAME).insert([
    {
      ...companion,
      last_updated: new Date(),
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Companion to DB: ${error.message}`);
  }

  return data;
}

interface SetCompanionStakedArgs {
  mintAddress: string;
  linkedForgeBotAddress: string;
  ownerWalletAddress: string;
}

export async function setCompanionAsStaked({
  mintAddress,
  linkedForgeBotAddress,
  ownerWalletAddress,
}: SetCompanionStakedArgs) {
  try {
    const data = await updateCompanionByMintAddress(mintAddress, {
      is_staked: true,
      linked_forgebot: linkedForgeBotAddress,
      owner_wallet_address: ownerWalletAddress,
      last_updated: new Date(),
    });

    return data;
  } catch (error) {
    console.log('Error setting Companion as staked', error);
    throw Error('Error setting Companion as staked');
  }
}

export async function setCompanionUnstaked(mintAddress: string) {
  try {
    const data = await updateCompanionByMintAddress(mintAddress, {
      is_staked: false,
      linked_forgebot: null,
      last_updated: new Date(),
    });

    return data;
  } catch (error) {
    console.log('Error setting Companion as unstaked', error);
    throw Error('Error setting Companion as unstaked');
  }
}

export async function updateCompanionByMintAddress(
  mintAddress: string,
  companionUpdateFields: Partial<Companion>
) {
  const { data, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .update({
      ...companionUpdateFields,
      last_updated: new Date(),
    })
    .match({ mint_address: mintAddress });

  if (error) {
    console.error(error);
    throw Error(`Error updating new ForgeBot to DB: ${error.message}`);
  }

  return data[0];
}

export async function addMultipleCompanions(
  companions: Array<Omit<Companion, 'created_at'>>
) {
  const { data, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .insert([...companions]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Companion to DB: ${error.message}`);
  }

  return data;
}

export async function getCompanionById(mintAddress: string) {
  const { data: companionData, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('mint_address', mintAddress);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving Companion by Mint Address DB: ${error.message} `);
  }

  return companionData[0];
}
