import dotenv from 'dotenv';
import { Router, Request, Response, NextFunction } from 'express';
import { Connection } from '@solana/web3.js';

import { isWalletAuthenticated } from '../../utils/wallet';

dotenv.config();

const NETWORK_URL = process.env.NETWORK_URL;

const handleNftAuthentication = async (
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
    ? response.status(200).send({
        statusCode: 200,
        body: {
          message: 'nft auth',
          isAuthenticated,
        },
      })
    : response.status(401).send({
        statusCode: 401,
        body: {
          message: 'auth failed!',
          isAuthenticated,
        },
      });
};

// Route assignments
const nftRouter = Router();
nftRouter.post(`/authenticate`, handleNftAuthentication);

export { nftRouter };
