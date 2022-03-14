import { add, parseISO, isAfter, formatDistance } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();
import { getNftById, updateNftById, addNft } from '../repository/nfts';
import { getWalletById, updateWalletById, addWallet } from '../repository/wallets';

// Offset to make the tokens into whole digits
const SPL_TOKEN_DECIMAL_MULTIPLIER = parseInt(process.env.SPL_TOKEN_DECIMAL_MULTIPLIER);
const PAYOUT_COOLDOWN = JSON.parse(process.env.PAYOUT_COOLDOWN);
const NETWORK = process.env.NETWORK;

export async function isNftOnCooldown(
  nftAddress: string
): Promise<{ isOnCooldown: boolean; timeToWaitString?: string }> {
  const dbNft = await getNftById(nftAddress);

  if (!dbNft) {
    return { isOnCooldown: false };
  }

  const nextPayoutTime = add(parseISO(dbNft.last_payout as string), PAYOUT_COOLDOWN);

  if (isAfter(new Date(), nextPayoutTime)) {
    return { isOnCooldown: false };
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
    // Add new NFT to the db
    return await addNft({
      id: nftAddress,
      last_payout: new Date(),
      wallet_owner: walletAddress,
      total_payout: payoutAmount,
      total_payout_for_ui: payoutAmount / SPL_TOKEN_DECIMAL_MULTIPLIER,
      network: NETWORK,
    });
  }

  return await updateNftById(nftAddress, {
    total_payout: currentNftInDb.total_payout + payoutAmount,
    total_payout_for_ui:
      (currentNftInDb.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
    last_payout: new Date(),
    wallet_owner: walletAddress,
  });
}

export async function isWalletOnCooldown(
  walletAddress: string
): Promise<{ isOnCooldown: boolean; timeToWaitString?: string }> {
  const dbWallet = await getWalletById(walletAddress);
  if (!dbWallet) {
    return { isOnCooldown: false };
  }

  const nextPayoutTime = add(parseISO(dbWallet.last_payout as string), PAYOUT_COOLDOWN);
  if (isAfter(new Date(), nextPayoutTime)) {
    return { isOnCooldown: false };
  }

  const timeToWaitString = formatDistance(nextPayoutTime, new Date());
  return { isOnCooldown: true, timeToWaitString: timeToWaitString };
}

export async function recordPayoutAndUpdateCooldownForWallet(
  walletAddress: string,
  payoutAmount: number
) {
  const currentDbWallet = await getWalletById(walletAddress);

  if (!currentDbWallet) {
    // Add new wallet
    return await addWallet({
      id: walletAddress,
      total_payout: payoutAmount,
      total_payout_for_ui: payoutAmount / SPL_TOKEN_DECIMAL_MULTIPLIER,
      last_payout: new Date(),
      network: NETWORK,
    });
  }

  return await updateWalletById(walletAddress, {
    total_payout: currentDbWallet.total_payout + payoutAmount,
    total_payout_for_ui:
      (currentDbWallet.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
    last_payout: new Date(),
  });
}
