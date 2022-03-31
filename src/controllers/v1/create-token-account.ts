import dotenv from 'dotenv';
import { Router, Request, Response, NextFunction } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

import { getServerWallet } from '../../utils';

dotenv.config();

const NETWORK_URL = process.env.NETWORK_URL;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;

const handleCreateTokenAccount = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { receivingWalletAddress } = request.body;

  const connection = new Connection(NETWORK_URL);

  const { gemWallet } = getServerWallet();
  const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
  const recievingAddress = new PublicKey(receivingWalletAddress);

  try {
    // Create a new token account for EGEMS
    const egemAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      gemWallet,
      mintPublicKey,
      recievingAddress,
      undefined,
      'finalized',
      { maxRetries: 5, commitment: 'finalized', skipPreflight: false }
    );

    return response.status(200).send({
      statusCode: 200,
      body: {
        message: 'token account existed, or was created',
        accountAddress: egemAccount.address.toBase58(),
      },
    });
  } catch (error) {
    console.error('error creating the token account: ', error);

    return response.status(500).send({
      statusCode: 500,
      body: {
        message: 'Error creating token account',
      },
    });
  }
};

// Route assignments
const accountRouter = Router();
accountRouter.post(`/createTokenAccount`, handleCreateTokenAccount);

export { accountRouter };
