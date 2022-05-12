import { processedConnection } from '../constants';
import { SetForgeBotStakedArgs } from '../types';
import { isNftInWallet } from '.';
import { getForgeBotById } from '../repository';

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
