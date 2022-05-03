import { getCompanionById } from '../repository';
import { processedConnection } from '../constants';
import { isNftInWallet } from './';
import {
  setCompanionAsStaked,
  setCompanionUnstaked as setCompanionUnstakedApi,
} from '../repository';

interface SetCompanionStakedArgs {
  mintAddress: string;
  linkedForgeBotAddress: string;
  walletAddress: string;
}

export async function setCompanionStaked({
  mintAddress,
  linkedForgeBotAddress,
  walletAddress,
}: SetCompanionStakedArgs) {
  const isCompanionEligible = await isCompanionEligibleForStaking(
    mintAddress,
    walletAddress,
    linkedForgeBotAddress
  );

  if (!isCompanionEligible) {
    throw Error('Companion is not eligible for staking.');
  }

  const updatedCompanionData = setCompanionAsStaked({
    mintAddress,
    linkedForgeBotAddress,
    ownerWalletAddress: walletAddress,
  });

  return updatedCompanionData;
}

// TODO Do we need to do user checks here?
export async function setCompanionUnstaked(mintAddress: string) {
  const updatedCompanion = await setCompanionUnstakedApi(mintAddress);
  return updatedCompanion;
}

export async function isCompanionEligibleForStaking(
  mintAddress: string,
  walletAddress: string,
  linkedForgetBotAddress: string
) {
  try {
    const isCompanionOwnedByWallet = await isNftInWallet({
      walletAddress,
      nftAddress: mintAddress,
      connection: processedConnection,
    });

    const isForgeBotOwnedByWallet = await isNftInWallet({
      walletAddress,
      nftAddress: linkedForgetBotAddress,
      connection: processedConnection,
    });

    if (!isCompanionOwnedByWallet || !isForgeBotOwnedByWallet) {
      throw Error(
        `${mintAddress} Companion or Linked ForgeBot NFT is not owned by this wallet.`
      );
      // return false;
    }

    const tempCompanion = await getCompanionById(mintAddress);

    if (!tempCompanion) {
      throw Error(`${mintAddress} Companion NFT does not exist!`);
      // console.log(`${mintAddress} Companion NFT does not exist!`);
      // return false;
    }

    return true;
  } catch (error) {
    console.log('Error while evaluating the companion:', error);
    throw Error(
      'Something went wrong while validating the Companion for staking eligibility...'
    );
  }
}
