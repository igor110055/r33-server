import { Router, Request, Response } from 'express';

async function handleStakeForgeBot(request: Request, response: Response) {
  const { forgebotNftAddress, walletAddress, companionNftAddress } = request.body;

  return response.json({
    code: 200,
    message: 'stub - stake fb',
  });
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
stakingRouter.post(`stake-forgebot`, handleStakeForgeBot);
stakingRouter.post(`unstake-forgebot`, handleUnstakeForgeBot);
stakingRouter.post(`stake-companion`, handleStakeCompanion);
stakingRouter.post(`unstake-companion`, handleUnstakeCompanion);
stakingRouter.post(`stake-all`, handleStakeAll);
stakingRouter.post(`unstake-all`, handleUnstakeAll);

export { stakingRouter };
