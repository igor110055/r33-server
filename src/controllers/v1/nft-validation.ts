import dotenv from 'dotenv';
import { Router, Request, Response, NextFunction } from 'express';
import { Connection } from '@solana/web3.js';

import { isWalletAuthenticated } from '../../utils/wallet-utils';

dotenv.config();

const NETWORK_URL = process.env.NETWORK_URL;

const handlerNftAuthentication = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { receivingWalletAddress, nftAddress } = request.body;

  const connection = new Connection(NETWORK_URL);

  const isAuthenticated = await isWalletAuthenticated({
    connection,
    walletAddress: receivingWalletAddress,
    nftAddress,
  });

  return isAuthenticated
    ? response.send({
        statusCode: 200,
        body: {
          message: 'nft auth',
          isAuthenticated,
        },
      })
    : response.send({
        statusCode: 401,
        body: {
          message: 'auth failed!',
          isAuthenticated,
        },
      });
};

// Route assignments
const nftRouter = Router();
nftRouter.post(`/authenticate`, handlerNftAuthentication);

export { nftRouter };
