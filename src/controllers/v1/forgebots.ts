import { Router, Request, Response } from 'express';
import {
  getForgeBotsByWalletOwnerFromDb,
  getForgeBotsByWalletOwnerFromChain,
} from '../../repository/forgebots';

async function handleGetForgeBotsByAccount(request: Request, response: Response) {
  const { walletAddress } = request.params;
  try {
    const forgeBotsInWallet = await getForgeBotsByWalletOwnerFromChain(walletAddress);

    return response.json({
      code: 200,
      message: 'ForgeBots by account Found!',
      data: forgeBotsInWallet,
    });
  } catch (error) {
    return response.status(500).json({
      code: 500,
      message: 'Error getting ForgeBots by account.',
    });
  }
}

// Route assignments
const forgeBotsRouter = Router();
forgeBotsRouter.get(`/account/:walletAddress`, handleGetForgeBotsByAccount);

export { forgeBotsRouter };
