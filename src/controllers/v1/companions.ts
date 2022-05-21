import { Router, Request, Response } from 'express';
import { getCompanionByWalletOwnerFromChain } from '../../repository/companions';

async function handleGetCompanionsByWalletAddress(request: Request, response: Response) {
  const { walletAddress } = request.params;
  try {
    const companionsInWallet = await getCompanionByWalletOwnerFromChain(walletAddress);

    return response.json({
      code: 200,
      message: 'Companions by account Found!',
      data: companionsInWallet,
    });
  } catch (error) {
    return response.status(500).json({
      code: 500,
      message: 'Error getting Companions by account.',
    });
  }
}

// Route assignments
const companionsRouter = Router();
companionsRouter.get(`/account/:walletAddress`, handleGetCompanionsByWalletAddress);

export { companionsRouter };
