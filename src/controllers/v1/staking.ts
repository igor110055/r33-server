import { Router, Request, Response } from 'express';
import { Companion, ForgeBot } from '../../types';
import { processedConnection } from '../../constants';

import {
  setCompanionStaked,
  setCompanionUnstaked,
  setForgeBotStaked,
  setForgeBotUnstaked,
  unstakePreviouslyLinkedCompanion,
  isNftInWallet,
} from '../../utils';

async function handleStakeForgeBot(request: Request, response: Response) {
  const { forgeBotMintAddress, walletAddress, companionNftAddress } = request.body;
  let updatedCompanion = null;
  let updatedForgeBot = null;
  let previousCompanionMintAddress = null;

  try {
    previousCompanionMintAddress = await unstakePreviouslyLinkedCompanion(
      forgeBotMintAddress
    );

    // Doing this method so we can call at the same time
    const stakingRequests: Promise<ForgeBot | Companion>[] = [
      setForgeBotStaked({
        walletAddress,
        forgeBotMintAddress: forgeBotMintAddress,
        linkedCompanionAddress: companionNftAddress,
      }),
    ];

    if (companionNftAddress) {
      stakingRequests.push(
        setCompanionStaked({
          mintAddress: companionNftAddress,
          linkedForgeBotAddress: forgeBotMintAddress,
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

    if (previousCompanionMintAddress) {
      await setCompanionStaked({
        mintAddress: previousCompanionMintAddress,
        linkedForgeBotAddress: forgeBotMintAddress,
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
  const { forgeBotMintAddress, walletAddress } = request.body;
  try {
    const isForgeBotInWallet = await isNftInWallet({
      walletAddress,
      nftAddress: forgeBotMintAddress,
      connection: processedConnection,
    });

    // TODO Should we actually forgo this check? - let them unstake if they don't own it anymore?
    if (!isForgeBotInWallet) {
      throw Error('ForgeBot not current in wallet, could not unstake!');
    }

    const updatedForgeBot = await setForgeBotUnstaked(forgeBotMintAddress);

    return response.status(200).json({
      code: 200,
      message: `Successfully unstaked ForgeBot ${forgeBotMintAddress}`,
      data: updatedForgeBot,
    });
  } catch (error) {
    console.log('Error unstaking ForgeBot', error);
    return response.status(500).json({
      code: 500,
      message: 'Failed to unstake ForgeBot',
    });
  }
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
