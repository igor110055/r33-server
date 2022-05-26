import { getCompanionById, getForgeBotById } from '../repository';
import { processedConnection } from '../constants';
import { isNftInWallet } from './';

export async function isCompanionEligibleForStaking(
  mintAddress: string,
  walletAddress: string
) {
  try {
    const isCompanionOwnedByWallet = await isNftInWallet({
      walletAddress,
      nftAddress: mintAddress,
      connection: processedConnection,
    });

    if (!isCompanionOwnedByWallet) {
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

export async function isCompanionEligibleForPairing({
  companionAddress,
  pairedForBotAddress,
  walletAddress,
}) {
  try {
    const [tempCompanion, tempForgeBot] = await Promise.all([
      await getCompanionById(companionAddress),
      await getForgeBotById(pairedForBotAddress),
    ]);

    if (tempForgeBot?.is_overseer) {
      throw Error('Overseer can not be paired with a Companion Bot!');
    }

    if (!tempCompanion || !tempForgeBot) {
      throw Error(`${companionAddress} Companion NFT of ForgeBot does not exist!`);
      // console.log(`${mintAddress} Companion NFT does not exist!`);
      // return false;
    }

    const [isCompanionOwnedByWallet, isForgeBotOwnedByWallet] = await Promise.all([
      await isNftInWallet({
        walletAddress,
        nftAddress: companionAddress,
        connection: processedConnection,
      }),
      await isNftInWallet({
        walletAddress,
        nftAddress: pairedForBotAddress,
        connection: processedConnection,
      }),
    ]);

    if (!isCompanionOwnedByWallet || !isForgeBotOwnedByWallet) {
      throw Error(
        `${companionAddress} Companion is owned by wallet: ${isCompanionOwnedByWallet} and linked ForgetBot ${pairedForBotAddress} is owned by wallet ${isForgeBotOwnedByWallet}.`
      );
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
