import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Companion } from '../types';
import {
  isCompanionEligibleForStaking,
  isCompanionEligibleForPairing,
  getCompanionsByWalletAddress,
} from '../utils';
import {
  updateForgeBot,
  clearLinkedCompanionByCompanionAddress,
  getForgeBotById,
  unstakeLinkedCompanionAndUnpair,
} from './forgebots';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_DB_KEY);
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
      updated_at: new Date(),
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
      updated_at: new Date(),
    });

    const forgeBotData = await updateForgeBot(linkedForgeBotAddress, {
      owner_wallet_address: ownerWalletAddress,
      linked_companion: mintAddress,
      updated_at: new Date(),
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
      updated_at: new Date(),
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
      updated_at: new Date(),
    });

    return data;
  } catch (error) {
    console.log('Error setting Companion as staked', error);
    throw Error('Error setting Companion as staked');
  }
}

// Breaks the ForgeBot link as well
export async function setCompanionAsUnstakedAndUnpaired(mintAddress: string) {
  try {
    const tempCompanion = await getCompanionById(mintAddress);
    const companionData = await updateCompanionByMintAddress(mintAddress, {
      is_staked: false,
      linked_forgebot: null,
      updated_at: new Date(),
    });

    // If it was even linked to a bot at all...
    if (tempCompanion.linked_forgebot) {
      const tempForgeBot = await getForgeBotById(tempCompanion.linked_forgebot);

      // If it matches the previous companion
      if (tempForgeBot.linked_companion === mintAddress) {
        await updateForgeBot(tempForgeBot.mint_address, {
          linked_companion: null,
        });
      }
    }

    return companionData;
  } catch (error) {
    console.log('Error setting Companion as unstaked', error);
    throw Error('Error setting Companion as unstaked');
  }
}

// Maintains linked status
export async function setCompanionAsUnstaked(mintAddress: string) {
  try {
    const data = await updateCompanionByMintAddress(mintAddress, {
      is_staked: false,
      updated_at: new Date(),
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
      updated_at: new Date(),
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
      updated_at: new Date(),
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

const companionSchema = `
  mint_address,
  created_at,
  owner_wallet_address,
  is_staked,
  image_url,
  attributes,
  name,
  linked_forgebot,
  companion_type: companion_types(
    id,
    name,
    egem_payout_bonus,
    display_name,
    ui_color
  )
`;

export async function getCompanionWithTypeById(mintAddress: string) {
  const { data: companionData, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .select(companionSchema)
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
    .select(companionSchema)
    .eq('owner_wallet_address', walletAddress);

  if (error) {
    console.error('Error retrieving companions by wallet address:', error);
    throw Error(`Error retrieving Companions by Wallet Address DB: ${error.message} `);
  }

  // Check dupes here!

  return companionData;
}

export async function getUnstakedCompanionsByWalletAddressDb(walletAddress: string) {
  const { data: companionData, error } = await supabase
    .from<Companion>(DATABASE_TABLE_NAME)
    .select(companionSchema)
    .eq('owner_wallet_address', walletAddress)
    .eq('is_staked', false);

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

    // To get the desired schema (the types as well)
    const dbCompanions = await getCompanionsByWalletAddressDb(walletAddress);

    // TODO determine if we need this
    // await compareCompanionsInWalletVsDb

    const sortedCompanions = dbCompanions.sort((a, b) => {
      if (a.mint_address > b.mint_address) {
        return 1;
      } else return -1;
    });

    return sortedCompanions;
  } catch (error) {
    console.log('error updating the companions in users wallet: ', error);
    throw Error('Error getting Companions in user wallet...');
  }
}

interface CompareCompanionsArgs {
  dbCompanions: Companion[];
  companionsInWallet: Array<{
    mint: string;
  }>;
}

// TODO Determine if we actually need this, currently unused
async function compareCompanionsInWalletVsDb({
  dbCompanions,
  companionsInWallet,
}: CompareCompanionsArgs) {
  dbCompanions.reduce((accumulator, currentCompanion) => {
    const tempMatchingCompanion = companionsInWallet.find(
      (walletCompanion) => walletCompanion.mint === currentCompanion.mint_address
    );

    if (tempMatchingCompanion) {
      return [...accumulator, currentCompanion];
    } else {
      unstakeLinkedCompanionAndUnpair(currentCompanion.mint_address);

      return accumulator;
    }
  }, []);
}

// TODO Determine if we actually need this, currently unused
async function checkCompanionLinkedToForgeBot(
  companionAddress: string,
  forgeBotAddress: string
) {
  try {
    const tempForgeBot = await getForgeBotById(forgeBotAddress);

    if (tempForgeBot.linked_companion !== companionAddress) {
      await updateCompanionByMintAddress(companionAddress, {
        linked_forgebot: null,
        is_staked: false,
      });

      await updateForgeBot(forgeBotAddress, {
        linked_companion: null,
      });
    }
  } catch (error) {
    console.log('Error checking companion/forgebot link: ', error);

    throw Error(error);
  }
}
