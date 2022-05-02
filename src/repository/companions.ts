import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { isNftInWallet } from '../utils';
import { connection } from '../constants';
import { Companion } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'companions';

export async function addCompanion(companion: Omit<Companion, 'created_at'>) {
  const { data, error } = await supabase.from<Companion>(DATABASE_TABLE_NAME).insert([
    {
      ...companion,
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new Companion to DB: ${error.message}`);
  }

  return data;
}

export async function updateCompanionByMintAddress(
  mintAddress: string,
  companionUpdateFields: Partial<Companion>
) {
  const { data, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .update({
      ...companionUpdateFields,
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

export async function isCompanionEligibleForStaking(
  mintAddress: string,
  walletAddress: string
) {
  try {
    const isCompanionOwnedByWallet = await isNftInWallet({
      walletAddress,
      nftAddress: mintAddress,
      connection,
    });

    if (!isCompanionOwnedByWallet) {
      throw Error('NFT is not owned by this wallet.');
    }

    const tempCompanion = await getCompanionById(mintAddress);

    if (!tempCompanion || tempCompanion.is_staked) {
      throw Error(`${mintAddress} Companion NFT does not exist, or is already staked!`);
    }

    return true;
  } catch (error) {
    console.log('Error while evaluating the companion:', error);
    throw Error(
      'Something went wrong while validating the Companion for staking eligibility...'
    );
  }
}
