import dotenv from 'dotenv';
import { Router, Request, Response, NextFunction } from 'express';
import { Connection } from '@solana/web3.js';
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';

import { isWalletAuthenticated } from '../../utils/wallet';
import { isValidCompanionNft, getNftMetadata, formatCompanionNft } from '../../utils/nfts';

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

const getForgeBotCompanionNfts = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { walletAddress } = request.query;
  const connection = new Connection(NETWORK_URL);

  const walletNfts = await getParsedNftAccountsByOwner({
    publicAddress: walletAddress,
    connection,
  });

  const companionNfts = walletNfts.filter(isValidCompanionNft);

  const metaDataFetchers = companionNfts.map(async (tempNft) => await getNftMetadata(tempNft));
  const metaDataResults = await Promise.all(metaDataFetchers);

  const formattedCompanionNfts = metaDataResults.map(formatCompanionNft);

  response.status(200).send({
    statusCode: 200,
    body: {
      message: 'wallets companions',
      companionNfts: formattedCompanionNfts,
    },
  });
};

// Route assignments
const nftRouter = Router();
nftRouter.post(`/authenticate`, handleNftAuthentication);
nftRouter.get('/companions', getForgeBotCompanionNfts);
export { nftRouter };
