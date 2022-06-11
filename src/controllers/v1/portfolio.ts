import { Router, Request, Response } from 'express';

import { getCompanionByWalletOwnerFromChain } from '../../repository/companions';
import { getForgeBotsByWalletOwnerFromChain } from '../../repository/forgebots';
import { getPorfolioEarningData } from '../../repository/portfolio';
import { getAccountByWalletAddress, createAccount } from '../../repository/accounts';

async function handleGetAccountsPortfolio(request: Request, response: Response) {
  const { walletAddress } = request.params;
  try {
    const account = await getAccountByWalletAddress(walletAddress);
    if (!account?.wallet_address) {
      // No account found, create one
      await createAccount(walletAddress);
    }

    const companionsInWallet = await getCompanionByWalletOwnerFromChain(walletAddress);
    const forgeBotsInWallet = await getForgeBotsByWalletOwnerFromChain(walletAddress);

    console.info(
      `Wallet address ${walletAddress} has ${companionsInWallet.length} Companions in wallet.`
    );

    return response.json({
      code: 200,
      message: 'Users portfolio data retrieved...',
      data: {
        companions: companionsInWallet,
        forgeBots: forgeBotsInWallet,
      },
    });
  } catch (error) {
    console.error(`Error getting users portfolio`, error);
    return response.status(500).json({
      code: 500,
      message: 'Error getting portfolio by account.',
    });
  }
}

async function handleGetPortfolioEarningData(request: Request, response: Response) {
  const { walletAddress } = request.params;
  try {
    const { dailyEarningRate, egemLockedBalance, egemUnclaimedBalance } =
      await getPorfolioEarningData(walletAddress);

    return response.json({
      code: 200,
      message: 'Users portfolio data retrieved...',
      data: { dailyEarningRate, egemLockedBalance, egemUnclaimedBalance },
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
portfolioRouter.get(`/earning/:walletAddress`, handleGetPortfolioEarningData);

export { portfolioRouter };
