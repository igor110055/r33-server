// TODO https://www.quicknode.com/guides/web3-sdks/how-to-mint-an-nft-on-solana
// TODO mint some spl tokens :point-up: to use
// TODO also this: https://spl.solana.com/token

// TODO retry TXs if they fail: https://solanacookbook.com/guides/retrying-transactions.html#before-a-transaction-is-processed

import { Router, Request, Response, NextFunction } from 'express';
import { mnemonicToSeedSync } from 'bip39';
import { PublicKey, Connection, Keypair, Commitment } from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  transfer,
  TokenAccountNotFoundError,
} from '@solana/spl-token';

import {
  validateWalletAddress,
  isWalletAuthenticated,
  isNftOnCooldown,
  isWalletOnCooldown,
  recordPayoutAndUpdateCooldownForNft,
  recordPayoutAndUpdateCooldownForWallet,
  getServerWallet,
} from '../../utils';

enum CoolDownType {
  Nft,
  Wallet,
}

// Offset to make the tokens into whole digits
const SPL_TOKEN_DECIMAL_MULTIPLIER = parseInt(process.env.SPL_TOKEN_DECIMAL_MULTIPLIER);

// Transaction Constants
const NETWORK_URL = process.env.NETWORK_MAINNET_URL;
const MAX_PAYOUT_ALLOWED = process.env.MAX_PAYOUT_ALLOWED;
const CONNECTION_COMMITMENT_LEVEL = process.env.CONNECTION_COMMITMENT_LEVEL;
const TOKEN_ACCOUNT_ADDRESS = process.env.TOKEN_ACCOUNT_ADDRESS;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
const NFT_AUTHENTICATED_PAYOUT =
  parseInt(process.env.NFT_AUTHENTICATED_PAYOUT) * SPL_TOKEN_DECIMAL_MULTIPLIER;
const NON_AUTHENTICATED_PAYOUT =
  parseInt(process.env.NON_AUTHENTICATED_PAYOUT) * SPL_TOKEN_DECIMAL_MULTIPLIER;
const NON_CONFIRMED_MESSAGE = 'Transaction was not confirmed in 30.00 seconds';
const BLOCKHASH_NOT_FOUND = 'Blockhash not found';
const TX_SIMULATION_FAILED = 'Transaction simulation failed';
const ACCOUNT_NOT_FOUND = 'TokenAccountNotFoundError';
const allRetryAllowedMessage = [
  NON_CONFIRMED_MESSAGE,
  BLOCKHASH_NOT_FOUND,
  TX_SIMULATION_FAILED,
  ACCOUNT_NOT_FOUND,
];

const handlePayout = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { receivingWalletAddress, amount, source, nftAddress } = request.body;
    if (amount > MAX_PAYOUT_ALLOWED) {
      throw new Error('Attempted to exceed maximum payout!');
    }

    const { gemWallet } = getServerWallet();
    const recievingAddress = new PublicKey(receivingWalletAddress);

    const connection = new Connection(NETWORK_URL, CONNECTION_COMMITMENT_LEVEL as Commitment);

    await validateWalletAddress(receivingWalletAddress, connection);
    await validateWalletAddress(gemWallet.publicKey.toBase58(), connection);
    const isAuthenticated = await isWalletAuthenticated({
      connection,
      walletAddress: receivingWalletAddress,
      nftAddress,
    });

    const payoutAmount = isAuthenticated ? NFT_AUTHENTICATED_PAYOUT : NON_AUTHENTICATED_PAYOUT;

    const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
    const tokenAccountPublicKey = new PublicKey(TOKEN_ACCOUNT_ADDRESS);
    const tokenAccount = await getAccount(connection, tokenAccountPublicKey);

    console.log(
      `payout initialized: remaining value after success: ${
        Number(tokenAccount.amount) - payoutAmount
      }`
    );

    if (payoutAmount > tokenAccount.amount) {
      // TODO notify admins that we're out of tokens! (sms? email? discord notif?)
      throw new Error(`Out of gems today! ${tokenAccount.amount} gems remain.`);
    }

    const currentCooldownType = isAuthenticated ? CoolDownType.Nft : CoolDownType.Wallet;
    if (isAuthenticated) {
      const { isOnCooldown, timeToWaitString } = await isNftOnCooldown(nftAddress);
      if (isOnCooldown) {
        throw Error(
          `NFT is still on cooldown. Please wait ${timeToWaitString} before trying again...`
        );
      }
    } else {
      const { isOnCooldown, timeToWaitString } = await isWalletOnCooldown(receivingWalletAddress);
      if (isOnCooldown) {
        throw Error(
          `Wallet is still on cooldown. Please wait ${timeToWaitString} before trying again...`
        );
      }
    }

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      gemWallet,
      mintPublicKey,
      recievingAddress,
      undefined,
      'confirmed',
      { maxRetries: 5, commitment: 'confirmed', skipPreflight: false }
    );

    console.log('to token account:', toTokenAccount.address.toBase58());

    const txHash = await transfer(
      connection,
      gemWallet,
      tokenAccountPublicKey,
      toTokenAccount.address,
      gemWallet.publicKey,
      payoutAmount
    );

    let dbWalletRes;
    let dbNftRes;

    // Increment cooldowns and Payouts in our offchain DB -
    if (currentCooldownType === CoolDownType.Nft) {
      dbNftRes = await recordPayoutAndUpdateCooldownForNft(
        nftAddress,
        payoutAmount,
        receivingWalletAddress
      );
    } else {
      dbWalletRes = await recordPayoutAndUpdateCooldownForWallet(
        receivingWalletAddress,
        payoutAmount
      );
    }

    const data = {
      receivingWalletAddress,
      amountPaidOut: payoutAmount,
      txHash,
    };

    response.send({
      statusCode: 200,
      body: {
        message: 'Egem payout successful!',
        data,
      },
    });
  } catch (error) {
    console.error(error);

    let isRetryAllowed = allRetryAllowedMessage.some((retryAllowedErrorMessage: string) => {
      return error?.message?.includes(retryAllowedErrorMessage);
    });

    // TokenAccountNotFound returning this to users
    // body: {message: {name: "TokenAccountNotFoundError"}, isRetryAllowed: false}
    // Looks like there is no message on the error, rather a name
    if (error instanceof TokenAccountNotFoundError) {
      error.message = 'Token account not found, please try again...';
      isRetryAllowed = true;
    }

    response.code(500).send({
      statusCode: 500,
      body: {
        message: error.message || error.name || error,
        isRetryAllowed,
      },
    });
  }
};

// Route assignments
const payoutRouter = Router();
payoutRouter.post(`/payout`, handlePayout);

export { payoutRouter };
