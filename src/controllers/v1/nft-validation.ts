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

  // TODO loop through all NFTs that match the companions NFT and return
  // In a good format for unity
  const walletNfts = await getParsedNftAccountsByOwner({
    publicAddress: walletAddress,
    connection,
  });

  const companionNfts = walletNfts.filter(isValidCompanionNft);

  console.log('wallet companions: ', companionNfts);
  const metaDataFetchers = companionNfts.map(async (tempNft) => await getNftMetadata(tempNft));
  const metaDataResults = await Promise.all(metaDataFetchers);

  const formattedCompanionNfts = metaDataResults.map(formatCompanionNft);

  // console.info('meta data results', metaDataResults);
  // console.info('meta data attributes', metaDataResults[0]?.attributes);

  response.status(200).send({
    statusCode: 200,
    body: {
      message: 'wallets companions',
      companionNfts: formattedCompanionNfts,
      metadata: metaDataResults,
    },
  });
};

// Route assignments
const nftRouter = Router();
nftRouter.post(`/authenticate`, handleNftAuthentication);
nftRouter.get('/companions', getForgeBotCompanionNfts);
export { nftRouter };
