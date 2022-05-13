import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Companion } from '../types';
import {
  isCompanionEligibleForStaking,
  isCompanionEligibleForPairing,
  getCompanionsByWalletAddress,
} from '../utils';
import { updateForgeBot, clearLinkedCompanionByCompanionAddress } from './forgebots';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'companions';

interface SetCompanionStakedArgs {
  mintAddress: string;
  linkedForgeBotAddress: string;
  ownerWalletAddress: string;
}

// Only handles unpairing the bots
export async function unpairEligibleCompanion(mintAddress, ownerWalletAddress) {
  const isCompanionEligible = await isCompanionEligibleForStaking(
    mintAddress,
    ownerWalletAddress
  );

  if (!isCompanionEligible) {
    throw Error('Companion is not eligible for staking.');
  }

  try {
    const companionData = await updateCompanionByMintAddress(mintAddress, {
      linked_forgebot: null,
      owner_wallet_address: ownerWalletAddress,
      last_updated: new Date(),
    });

    let forgeBotData = await clearLinkedCompanionByCompanionAddress(mintAddress);

    return { companionData, forgeBotData };
  } catch (error) {
    console.log('Error setting Companion as staked', error);
    throw Error('Error setting Companion as staked');
  }
}

// Only handles pairing the bots together, not staking
export async function pairEligibleCompanionWithForgeBot({
  mintAddress,
  linkedForgeBotAddress,
  ownerWalletAddress,
}: SetCompanionStakedArgs) {
  const isCompanionEligible = await isCompanionEligibleForPairing({
    companionAddress: mintAddress,
    pairedForBotAddress: linkedForgeBotAddress,
    walletAddress: ownerWalletAddress,
  });

  if (!isCompanionEligible) {
    throw Error('Companion is not eligible for staking.');
  }

  try {
    const companionData = await updateCompanionByMintAddress(mintAddress, {
      linked_forgebot: linkedForgeBotAddress,
      owner_wallet_address: ownerWalletAddress,
      last_updated: new Date(),
    });

    const forgeBotData = await updateForgeBot(linkedForgeBotAddress, {
      owner_wallet_address: ownerWalletAddress,
      linked_companion: mintAddress,
      last_updated: new Date(),
    });

    return { companionData, forgeBotData };
  } catch (error) {
    console.log('Error setting Companion as staked', error);
    throw Error('Error setting Companion as staked');
  }
}

export async function setEligibleCompanionAsStaked({
  mintAddress,
  linkedForgeBotAddress,
  ownerWalletAddress,
}: SetCompanionStakedArgs) {
  const isCompanionEligible = await isCompanionEligibleForStaking(
    mintAddress,
    ownerWalletAddress
  );

  if (!isCompanionEligible) {
    throw Error('Companion is not eligible for staking.');
  }

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

export async function setCompanionAsUnstaked(mintAddress: string) {
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

// CRUD Operations
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

export async function getCompanionsByWalletAddressDb(walletAddress: string) {
  const { data: companionData, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('owner_wallet_address', walletAddress);

  if (error) {
    console.error('Error retrieving companions by wallet address:', error);
    throw Error(`Error retrieving Companions by Wallet Address DB: ${error.message} `);
  }

  return companionData;
}

export async function getCompanionByWalletOwnerFromChain(walletAddress: string) {
  const companionsInWallet = await getCompanionsByWalletAddress(walletAddress);

  try {
    const companionUpdateRequests = companionsInWallet.map(
      async (tempCompanion) =>
        await updateCompanionByMintAddress(tempCompanion.mint, {
          owner_wallet_address: walletAddress,
        })
    );

    const updatedCompanions = await Promise.all(companionUpdateRequests);
    return updatedCompanions;
  } catch (error) {
    console.log('error updating the bots: ', error);
    throw Error('Error getting ForgeBots in user wallet...');
  }

  // return forgeBotsInWallet;
}
