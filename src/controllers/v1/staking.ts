import { Router, Request, Response } from 'express';
import { Companion, ForgeBot } from '../../types';
import { processedConnection } from '../../constants';

import { isNftInWallet } from '../../utils';

import {
  setCompanionAsUnstaked,
  setCompanionAsStaked,
  setEligibleForgeBotStaked,
  setEligibleCompanionAsStaked,
  setForgeBotUnstaked,
  unstakeLinkedCompanion,
  pairEligibleCompanionWithForgeBot,
  unpairEligibleCompanion,
  getStakedForgeBotCount,
} from '../../repository';

let solPrice = 47.33;
let forgeBotsFloorPrice = 0.4;

// TODO Use these for light caching
let lastPricingDataUpdate;

async function handleStakeForgeBot(request: Request, response: Response) {
  const { forgeBotMintAddress, walletAddress, companionNftAddress } = request.body;
  let updatedCompanion = null;
  let updatedForgeBot = null;
  let previousCompanionMintAddress = null;

  try {
    previousCompanionMintAddress = await unstakeLinkedCompanion(forgeBotMintAddress);

    // Doing this method so we can call at the same time
    const stakingRequests: Promise<ForgeBot | Companion>[] = [
      setEligibleForgeBotStaked({
        walletAddress,
        forgeBotMintAddress: forgeBotMintAddress,
        linkedCompanionAddress: companionNftAddress,
      }),
    ];

    if (companionNftAddress) {
      stakingRequests.push(
        setEligibleCompanionAsStaked({
          mintAddress: companionNftAddress,
          linkedForgeBotAddress: forgeBotMintAddress,
          ownerWalletAddress: walletAddress,
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
      await setCompanionAsUnstaked(updatedCompanion.mint_address);
    }

    if (updatedForgeBot) {
      await setForgeBotUnstaked(updatedForgeBot.mint_address);
    }

    if (previousCompanionMintAddress) {
      await setCompanionAsStaked({
        mintAddress: previousCompanionMintAddress,
        linkedForgeBotAddress: forgeBotMintAddress,
        ownerWalletAddress: walletAddress,
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

async function handlePairCompanion(request: Request, response: Response) {
  const { forgeBotMintAddress, companionMintAddress, walletAddress } = request.body;
  try {
    const pairingData = await pairEligibleCompanionWithForgeBot({
      mintAddress: companionMintAddress,
      linkedForgeBotAddress: forgeBotMintAddress,
      ownerWalletAddress: walletAddress,
    });

    return response.json({
      code: 200,
      message: 'Companions Paired!',
      data: pairingData,
    });
  } catch (error) {
    console.log('Error pairing companion: ', error);
    return response.status(500).json({
      code: 500,
      message: 'Error pairing companion.',
    });
  }
}

async function handleUnpairCompanion(request: Request, response: Response) {
  const { companionMintAddress, walletAddress } = request.body;
  try {
    const pairingData = await unpairEligibleCompanion(
      companionMintAddress,
      walletAddress
    );

    return response.json({
      code: 200,
      message: 'Companions Unpaired!',
      data: pairingData,
    });
  } catch (error) {
    console.log('Error pairing companion: ', error);
    return response.status(500).json({
      code: 500,
      message: 'Error pairing companion',
    });
  }
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

async function handleGetStakingData(request: Request, response: Response) {
  const stakedForgeBotCount = await getStakedForgeBotCount();
  // TODO get staked companion count and use for the value calc (? for percentage staked as well?)

  const percentageStaked = stakedForgeBotCount / 3333;
  const valueStakedInSol = stakedForgeBotCount * forgeBotsFloorPrice;
  const valueStakedInUsd = valueStakedInSol * solPrice;

  return response.json({
    code: 200,
    message: 'Forgebot Staking Data',
    data: {
      percentageStaked,
      valueStakedInSol,
      valueStakedInUsd,
    },
  });
}

// Route assignments
const stakingRouter = Router();
stakingRouter.post(`/stake-forgebot`, handleStakeForgeBot);
stakingRouter.post(`/unstake-forgebot`, handleUnstakeForgeBot);
stakingRouter.post(`/pair-companion`, handlePairCompanion);
stakingRouter.post(`/unpair-companion`, handleUnpairCompanion);
stakingRouter.post(`/stake-all`, handleStakeAll);
stakingRouter.post(`/unstake-all`, handleUnstakeAll);
stakingRouter.get(`/data`, handleGetStakingData);

export { stakingRouter };
