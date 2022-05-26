import { Router, Request, Response } from 'express';
import axios from 'axios';

import { Companion, ForgeBot } from '../../types';
import {
  processedConnection,
  MAGIC_EDEN_API_URL,
  FIVE_MINUTES_IN_MS,
} from '../../constants';

import { isNftInWallet } from '../../utils';

import {
  setCompanionAsUnstaked,
  setCompanionAsStaked,
  setEligibleForgeBotStaked,
  setEligibleCompanionAsStaked,
  setForgeBotUnstaked,
  unstakeLinkedCompanionAndUnpair,
  pairEligibleCompanionWithForgeBot,
  unpairEligibleCompanion,
  getStakedForgeBotCount,
} from '../../repository';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

let solPrice = 47.33;
let forgeBotsFloorPrice = 0;
let nextPricingUpdateTime = Date.now();

async function handleStakeForgeBot(request: Request, response: Response) {
  // TODO Require Auth

  const { forgeBotMintAddress, walletAddress, companionMintAddress } = request.body;
  let updatedCompanion = null;
  let updatedForgeBot = null;
  let previousCompanionMintAddress = null;

  console.log(
    'beginning staking process: ',
    forgeBotMintAddress,
    walletAddress,
    companionMintAddress
  );

  try {
    previousCompanionMintAddress = await unstakeLinkedCompanionAndUnpair(
      forgeBotMintAddress
    );

    // Doing this method so we can call at the same time
    const stakingRequests: Promise<ForgeBot | Companion>[] = [
      setEligibleForgeBotStaked({
        walletAddress,
        forgeBotMintAddress: forgeBotMintAddress,
        linkedCompanionAddress: companionMintAddress,
      }),
    ];

    if (companionMintAddress) {
      stakingRequests.push(
        setEligibleCompanionAsStaked({
          mintAddress: companionMintAddress,
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
  // TODO Require Auth
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
  // TODO Require Auth

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
  // TODO Require Auth
  const { companionNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - stake all fb in wallet (including companions)',
  });
}

async function handleUnstakeAll(request: Request, response: Response) {
  // TODO Require Auth
  const { companionNftAddress, walletAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - unstake all fb in wallet (including companions)',
  });
}

async function handleGetStakingData(request: Request, response: Response) {
  const stakedForgeBotCount = await getStakedForgeBotCount();

  if (Date.now() > nextPricingUpdateTime) {
    console.log('fetching price data from Binance...');
    const priceResponse = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDC`
    );

    const forgeBotsCollectionData = await axios.get(
      `${MAGIC_EDEN_API_URL}/collections/forgebots/stats`
    );

    console.log('fetching collection data from Magic Eden...');

    forgeBotsFloorPrice =
      forgeBotsCollectionData?.data?.floorPrice / LAMPORTS_PER_SOL || 0;
    solPrice = priceResponse?.data?.price || 0;

    nextPricingUpdateTime = Date.now() + FIVE_MINUTES_IN_MS;
  }

  const percentageStaked = stakedForgeBotCount / 3333;
  const valueStakedInSol = stakedForgeBotCount * forgeBotsFloorPrice;
  const valueStakedInUsd = valueStakedInSol * solPrice;

  return response.json({
    code: 200,
    message: 'Forgebot Staking Data',
    data: {
      currentForgeBotsFloorPrice: forgeBotsFloorPrice?.toFixed(2),
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
