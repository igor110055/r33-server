import { createClient } from '@supabase/supabase-js';
import { add, parseISO, isAfter, formatDistance } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();
import { getNftById, updateNftById, addNft } from '../repository/nfts';
import { getWalletById, updateWalletById, addWallet } from '../repository/wallets';

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);

// Offset to make the tokens into whole digits
const SPL_TOKEN_DECIMAL_MULTIPLIER = parseInt(process.env.SPL_TOKEN_DECIMAL_MULTIPLIER);
const PAYOUT_COOLDOWN = JSON.parse(process.env.PAYOUT_COOLDOWN);
const NETWORK = process.env.NETWORK;

// Depreciated
async function handleNftCooldown(
  nftAddress: string,
  payoutAmount: number,
  receivingWalletAddress: string
) {
  const dbNft = await getNftById(nftAddress);

  let dbNftRes;
  if (dbNft) {
    const nextPayoutTime = add(parseISO(dbNft.last_payout as string), PAYOUT_COOLDOWN);

    console.log(new Date(), ' >= ', nextPayoutTime, isAfter(new Date(), nextPayoutTime));

    if (isAfter(new Date(), nextPayoutTime)) {
      // payout
      dbNftRes = await updateNftById(nftAddress, {
        total_payout: dbNft.total_payout + payoutAmount,
        total_payout_for_ui: (dbNft.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
        last_payout: new Date(),
        wallet_owner: receivingWalletAddress,
      });
    } else {
      // Don't payout...
      const timeToWaitString = formatDistance(nextPayoutTime, new Date());
      throw Error(`Payout not eligible for this NFT, please wait ${timeToWaitString}...`);
    }
  } else {
    // Add new NFT to the db
    dbNftRes = addNft({
      id: nftAddress,
      last_payout: new Date(),
      wallet_owner: receivingWalletAddress,
      total_payout: payoutAmount,
      total_payout_for_ui: payoutAmount / SPL_TOKEN_DECIMAL_MULTIPLIER,
      network: NETWORK,
    });
  }

  return dbNftRes;
}

export async function isNftOnCooldown(
  nftAddress: string
): Promise<{ isOnCooldown: boolean; timeToWaitString?: string }> {
  const dbNft = await getNftById(nftAddress);
  const nextPayoutTime = add(parseISO(dbNft.last_payout as string), PAYOUT_COOLDOWN);

  if (isAfter(new Date(), nextPayoutTime)) {
    return { isOnCooldown: false, timeToWaitString: null };
  }

  // Don't payout...
  const timeToWaitString = formatDistance(nextPayoutTime, new Date());
  return { isOnCooldown: true, timeToWaitString: timeToWaitString };
}

export async function recordPayoutAndUpdateCooldownForNft(
  nftAddress: string,
  payoutAmount: number,
  walletAddress: string
) {
  const currentNftInDb = await getNftById(nftAddress);

  if (!currentNftInDb) {
    throw new Error(`Could not update NFT as no NFT with ${nftAddress} was found...`);
  }

  return await updateNftById(nftAddress, {
    total_payout: currentNftInDb.total_payout + payoutAmount,
    total_payout_for_ui:
      (currentNftInDb.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
    last_payout: new Date(),
    wallet_owner: walletAddress,
  });
}

export async function recordPayoutAndUpdateCooldownForWallet(
  walletAddress: string,
  payoutAmount: number
) {
  const currentDbWallet = await getWalletById(walletAddress);

  if (!currentDbWallet) {
    throw new Error(`Could not update Wallet as no Wallet with ${walletAddress} was found...`);
  }

  return await updateWalletById(walletAddress, {
    total_payout: currentDbWallet.total_payout + payoutAmount,
    total_payout_for_ui:
      (currentDbWallet.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
    last_payout: new Date(),
  });
}

export async function isWalletOnCooldown(
  walletAddress: string
): Promise<{ isOnCooldown: boolean; timeToWaitString?: string }> {
  const dbWallet = await getWalletById(walletAddress);
  const nextPayoutTime = add(parseISO(dbWallet.last_payout as string), PAYOUT_COOLDOWN);
  if (isAfter(new Date(), nextPayoutTime)) {
    return { isOnCooldown: false };
  }

  const timeToWaitString = formatDistance(nextPayoutTime, new Date());
  return { isOnCooldown: true, timeToWaitString: timeToWaitString };
}

// Depreciated
async function handleWalletCooldown(receivingWalletAddress: string, payoutAmount: number) {
  const dbWallet = await getWalletById(receivingWalletAddress);

  if (dbWallet) {
    // Wallet already exists in our system
    const nextPayoutTime = add(parseISO(dbWallet.last_payout as string), PAYOUT_COOLDOWN);
    if (isAfter(new Date(), nextPayoutTime)) {
      return await updateWalletById(receivingWalletAddress, {
        total_payout: dbWallet.total_payout + payoutAmount,
        total_payout_for_ui: (dbWallet.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
        last_payout: new Date(),
      });
    } else {
      // TODO don't payout
      const timeToWaitString = formatDistance(nextPayoutTime, new Date());
      throw Error(`This wallet is still on cooldown... please wait ${timeToWaitString}`);
    }
  } else {
    // Wallet does not exist, create one plz
    return await addWallet({
      id: receivingWalletAddress,
      last_payout: new Date(),
      total_payout: payoutAmount,
      total_payout_for_ui: payoutAmount / SPL_TOKEN_DECIMAL_MULTIPLIER,
      network: NETWORK,
    });
  }
}
