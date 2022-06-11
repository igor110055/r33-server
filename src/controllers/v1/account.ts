import { Router, Request, Response } from 'express';
import { createAccount } from '../../repository';

const handleCreateAccount = async (request: Request, response: Response) => {
  // TODO Auth Stuff...
  try {
    const { walletAddress } = request.body;

    const result = await createAccount(walletAddress);

    return response.json({
      code: 200,
      message: 'Account successfully created',
      data: result,
    });
  } catch (error) {
    console.log('Error when creating account', error);
    return response.status(500).json({
      code: 500,
      message: 'Error creating account.',
    });
  }
};

// Route assignments
const accountRouter = Router();
accountRouter.post(`/create`, handleCreateAccount);

export { accountRouter };
