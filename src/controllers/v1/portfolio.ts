import { Router, Request, Response } from 'express';

import { getCompanionByWalletOwnerFromChain } from '../../repository/companions';
import { getForgeBotsByWalletOwnerFromChain } from '../../repository/forgebots';

async function handleGetAccountsPortfolio(request: Request, response: Response) {
  const { walletAddress } = request.params;
  try {
    const companionsInWallet = await getCompanionByWalletOwnerFromChain(walletAddress);
    const forgeBotsInWallet = await getForgeBotsByWalletOwnerFromChain(walletAddress);

    return response.json({
      code: 200,
      message: 'Users portfolio data retrieved...',
      data: {
        companions: companionsInWallet,
        forgeBots: forgeBotsInWallet,
      },
    });
  } catch (error) {
    return response.status(500).json({
      code: 500,
      message: 'Error getting portfolio by account.',
    });
  }
}

// Route assignments
const portfolioRouter = Router();
portfolioRouter.get(`/:walletAddress`, handleGetAccountsPortfolio);

export { portfolioRouter };
