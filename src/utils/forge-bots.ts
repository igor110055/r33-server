import { processedConnection } from '../constants';
import { SetForgeBotStakedArgs } from '../types';
import { isNftInWallet } from './';
import {
  getForgeBotById,
  setForgeBotStaked as setForgeBotStakedApi,
  setForgeBotUnstaked as setForgeBotUnstakedApi,
  setCompanionUnstaked,
} from '../repository';

export async function setForgeBotStaked({
  walletAddress,
  forgeBotMintAddress,
  linkedCompanionAddress,
}: SetForgeBotStakedArgs) {
  const isEligible = await isForgeBotEligibleForStaking({
    walletAddress,
    forgeBotMintAddress,
    linkedCompanionAddress,
  });

  if (!isEligible) {
    throw Error('ForgeBot is not eligible for staking!');
  }

  const updatedForgeBot = await setForgeBotStakedApi({
    walletAddress,
    forgeBotMintAddress,
    linkedCompanionAddress,
  });

  return updatedForgeBot;
}

export async function setForgeBotUnstaked(mintAddress) {
  const updatedForgeBot = await setForgeBotUnstakedApi(mintAddress);
  return updatedForgeBot;
}

export async function isForgeBotEligibleForStaking({
  walletAddress,
  forgeBotMintAddress,
  linkedCompanionAddress,
}: SetForgeBotStakedArgs) {
  const tempForgeBot = await getForgeBotById(forgeBotMintAddress);

  const isFbOwnedByWallet = await isNftInWallet({
    walletAddress,
    nftAddress: forgeBotMintAddress,
    connection: processedConnection,
  });

  if (!isFbOwnedByWallet || !tempForgeBot) {
    throw Error(
      'ForgeBot does not exist or is not owned by wallet, could not set ForgeBot in the staked status!'
    );
  }

  return true;
}

export async function unstakePreviouslyLinkedCompanion(forgeBotMintAddress) {
  const tempFb = await getForgeBotById(forgeBotMintAddress);

  if (tempFb.linked_companion) {
    const updatedCompanion = await setCompanionUnstaked(tempFb.linked_companion);
    return updatedCompanion.mint_address;
  }

  return null;
}
