import { Router, Request, Response } from 'express';
import { Companion, ForgeBot } from '../../types';

import {
  setCompanionStaked,
  setCompanionUnstaked,
  setForgeBotStaked,
  setForgeBotUnstaked,
  unstakePreviouslyLinkedCompanion,
} from '../../utils';

async function handleStakeForgeBot(request: Request, response: Response) {
  const { forgeBotNftAddress, walletAddress, companionNftAddress } = request.body;
  let updatedCompanion = null;
  let updatedForgeBot = null;
  let previousCompanion = null;

  try {
    previousCompanion = await unstakePreviouslyLinkedCompanion(forgeBotNftAddress);

    // Doing this method so we can call at the same time
    const stakingRequests: Promise<ForgeBot | Companion>[] = [
      setForgeBotStaked({
        walletAddress,
        forgeBotMintAddress: forgeBotNftAddress,
        linkedCompanionAddress: companionNftAddress,
      }),
    ];

    if (companionNftAddress) {
      stakingRequests.push(
        setCompanionStaked({
          mintAddress: companionNftAddress,
          linkedForgeBotAddress: forgeBotNftAddress,
          walletAddress,
        })
      );
    }

    const [updatedForgeBot, updatedCompanion] = await Promise.all(stakingRequests);

    return response.json({
      code: 200,
      message: 'Staking successful!',
      forgeBotData: updatedForgeBot,
      companionData: updatedCompanion,
    });
  } catch (error) {
    console.log(`error`, error);
    // We're unstaking the companions and the forgebot
    // Just in case we updated one but not the other
    if (updatedCompanion) {
      await setCompanionUnstaked(updatedCompanion.mint_address);
    }

    if (updatedForgeBot) {
      await setForgeBotUnstaked(updatedForgeBot.mint_address);
    }

    if (previousCompanion) {
      await setCompanionStaked({
        mintAddress: previousCompanion,
        linkedForgeBotAddress: forgeBotNftAddress,
        walletAddress,
      });
    }

    return response.status(500).json({
      code: 500,
      message: 'Error occured when attempting to stake...',
      error,
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
