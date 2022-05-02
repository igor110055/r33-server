import { Router, Request, Response } from 'express';

import {
  updateForgeBot,
  updateCompanionByMintAddress,
  isCompanionEligibleForStaking,
} from '../../repository';
import { isNftInWallet } from '../../utils';
import { connection } from '../../constants';

async function handleStakeForgeBot(request: Request, response: Response) {
  const { forgebotNftAddress, walletAddress, companionNftAddress } = request.body;
  let stakedCompanionMintAddress = null;
  let updatedCompanion = null;

  try {
    const isForgeBotOwnedByWallet = await isNftInWallet({
      walletAddress,
      nftAddress: forgebotNftAddress,
      connection,
    });

    if (!isForgeBotOwnedByWallet) {
      throw Error('NFT is not owned by this wallet.');
    }

    if (companionNftAddress) {
      const isCompanionEligible = await isCompanionEligibleForStaking(
        companionNftAddress,
        walletAddress
      );

      if (isCompanionEligible) {
        updatedCompanion = await updateCompanionByMintAddress(companionNftAddress, {
          is_staked: true,
          linked_forgebot: forgebotNftAddress,
          owner_wallet_address: walletAddress,
        });
      } else {
        throw Error('Companion Ineligible for Staking...');
      }
    }

    const forgeBotUpdateResult = await updateForgeBot(forgebotNftAddress, {
      is_staked: true,
      owner_wallet_address: walletAddress,
      linked_companion: updatedCompanion?.mint_address || null,
    });

    return response.json({
      code: 200,
      message: 'Staking successful!',
      forgeBotData: forgeBotUpdateResult,
      companionData: updatedCompanion,
    });
  } catch (error) {
    return response.status(500).json({
      code: 500,
      message: 'Error occured when attempting to stake...',
    });
  }
}

async function handleUnstakeForgeBot(request: Request, response: Response) {
  const { forgebotNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - unstake fb',
  });
}

async function handleStakeCompanion(request: Request, response: Response) {
  const { forgebotNftAddress, companionNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - stake companion',
  });
}

async function handleUnstakeCompanion(request: Request, response: Response) {
  const { companionNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - unstake companion',
  });
}

async function handleStakeAll(request: Request, response: Response) {
  const { companionNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - stake all fb in wallet (including companions)',
  });
}

async function handleUnstakeAll(request: Request, response: Response) {
  const { companionNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - unstake all fb in wallet (including companions)',
  });
}

// Route assignments
const stakingRouter = Router();
stakingRouter.post(`/stake-forgebot`, handleStakeForgeBot);
stakingRouter.post(`/unstake-forgebot`, handleUnstakeForgeBot);
stakingRouter.post(`/stake-companion`, handleStakeCompanion);
stakingRouter.post(`/unstake-companion`, handleUnstakeCompanion);
stakingRouter.post(`/stake-all`, handleStakeAll);
stakingRouter.post(`/unstake-all`, handleUnstakeAll);

export { stakingRouter };
