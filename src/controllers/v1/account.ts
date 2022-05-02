import { Router, Request, Response } from 'express';
import { generateNewAccountObject } from '../../utils';
import { createAccount as createAccountApi } from '../../repository';

const createAccount = async (request: Request, response: Response) => {
  // TODO Auth Stuff...
  try {
    const { walletAddress } = request.body;
    const tempAccount = generateNewAccountObject(walletAddress);

    const result = await createAccountApi(tempAccount);

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
accountRouter.post(`/create`, createAccount);

export { accountRouter };
