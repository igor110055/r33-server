import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { ForgeBot, SetForgeBotStakedArgs } from '../types';
import { getForgeBotsByWalletAddress, isForgeBotEligibleForStaking } from '../utils';

import { setCompanionAsUnstaked } from './companions';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'forgebots';

// Does eligibility checks
export async function setEligibleForgeBotStaked({
  forgeBotMintAddress,
  walletAddress,
  linkedCompanionAddress,
}) {
  const isEligible = await isForgeBotEligibleForStaking({
    walletAddress,
    forgeBotMintAddress,
    linkedCompanionAddress,
  });

  if (!isEligible) {
    throw Error('ForgeBot is not eligible for staking!');
  }

  const forgeBotData = await setForgeBotStaked({
    forgeBotMintAddress,
    walletAddress,
    linkedCompanionAddress,
  });

  return forgeBotData;
}

// Base update with no eligibility checks
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

export async function unstakeLinkedCompanion(forgeBotMintAddress) {
  const forgeBot = await getForgeBotById(forgeBotMintAddress);

  if (forgeBot.linked_companion) {
    const updatedCompanion = await setCompanionAsUnstaked(
      forgeBot.linked_companion as string
    );
    return updatedCompanion.mint_address;
  }

  return null;
}

export async function clearLinkedCompanionByCompanionAddress(companionMintAddress) {
  const tempForgeBot = await getForgeBotByLinkedCompanionAddress(companionMintAddress);
  let updatedForgetBot;

  if (tempForgeBot) {
    updatedForgetBot = await updateForgeBot(tempForgeBot.mint_address, {
      linked_companion: null,
      last_updated: new Date(),
    });
  }

  return updatedForgetBot;
}

// CRUD Operations
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

const forgeBotSchemaWithCompanion = `
mint_address,
created_at,
owner_wallet_address,
egems_unclaimed_balance,
egems_total_claimed,
egems_locked_balance,
linked_companion: companions!forgebots_linked_companion_fkey(
  mint_address,
  created_at,
  owner_wallet_address,
  companion_type,
  is_staked,
  image_url,
  attributes,
  name,
  avatar_asset_url,
  last_updated
),
image_url,
is_staked,
is_overseer,
attributes,
name,
last_updated
`;

export async function getForgeBotWithCompanionById(mintAddress: string) {
  const { data: forgeBotData, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .select(forgeBotSchemaWithCompanion)
    .eq('mint_address', mintAddress);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving ForgeBot by Mint Address DB: ${error.message} `);
  }

  return forgeBotData[0];
}

export async function getForgeBotWithCompanionByName(name: string) {
  const { data: forgeBotData, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .select(forgeBotSchemaWithCompanion)
    .textSearch('name', name);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving ForgeBot by Mint Address DB: ${error.message} `);
  }

  return forgeBotData[0];
}

export async function getForgeBotByLinkedCompanionAddress(linkedCompanionAddress) {
  const { data: forgeBotData, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('linked_companion', linkedCompanionAddress);

  return forgeBotData[0];
}

export async function getForgeBotsByWalletOwnerFromDb(walletAddress: string) {
  const { data: forgeBotData, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('owner_wallet_address', walletAddress);

  return forgeBotData;
}

export async function getForgeBotsByWalletOwnerFromChain(walletAddress: string) {
  const forgeBotsInWallet = await getForgeBotsByWalletAddress(walletAddress);

  try {
    const forgeBotUpdateRequests = forgeBotsInWallet.map(
      async (tempForgeBot) =>
        await updateForgeBot(tempForgeBot.mint, {
          owner_wallet_address: walletAddress,
        })
    );

    const updatedForgeBots = await Promise.all(forgeBotUpdateRequests);
    return updatedForgeBots;
  } catch (error) {
    console.log('error updating the bots: ', error);
    throw Error('Error getting ForgeBots in user wallet...');
  }
}

export async function getStakedForgeBotCount() {
  const { data: forgeBotData, error } = await supabase
    .from<any>(DATABASE_TABLE_NAME)
    .select('count', { count: 'exact' })
    .eq('is_staked', true);

  return forgeBotData[0]?.count;
}
