// TODO https://www.quicknode.com/guides/web3-sdks/how-to-mint-an-nft-on-solana
// TODO mint some spl tokens :point-up: to use
// TODO also this: https://spl.solana.com/token

// TODO retry TXs if they fail: https://solanacookbook.com/guides/retrying-transactions.html#before-a-transaction-is-processed

import { Router, Request, Response, NextFunction } from 'express';
import {
  PublicKey,
  Connection,
  Commitment,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  sendAndConfirmTransaction,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  transfer,
  TokenAccountNotFoundError,
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';

import {
  validateWalletAddress,
  isWalletAuthenticated,
  isNftOnCooldown,
  isWalletOnCooldown,
  recordPayoutAndUpdateCooldownForNft,
  recordPayoutAndUpdateCooldownForWallet,
  getServerWallet,
  sleep,
} from '../../utils';

import { getUnclaimedEgemsByWalletAddress } from '../../repository/portfolio';

import { SPL_TOKEN_DECIMALS } from '../../constants';
import {
  createPayoutTransaction,
  getPayoutTransactionById,
  updatePayoutTransaction,
} from '../../repository/payout-transaction';
import { updateAccountByWalletAddress } from '../../repository/accounts';

enum CoolDownType {
  Nft,
  Wallet,
}

const FAILURE_TIMEOUT_MS = 1000;

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

    const connection = new Connection(
      NETWORK_URL,
      CONNECTION_COMMITMENT_LEVEL as Commitment
    );

    await validateWalletAddress(receivingWalletAddress, connection);
    await validateWalletAddress(gemWallet.publicKey.toBase58(), connection);
    const isAuthenticated = await isWalletAuthenticated({
      connection,
      walletAddress: receivingWalletAddress,
      nftAddress,
    });

    const payoutAmount = isAuthenticated
      ? NFT_AUTHENTICATED_PAYOUT
      : NON_AUTHENTICATED_PAYOUT;

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
      const { isOnCooldown, timeToWaitString } = await isWalletOnCooldown(
        receivingWalletAddress
      );
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

    let isRetryAllowed = allRetryAllowedMessage.some(
      (retryAllowedErrorMessage: string) => {
        return error?.message?.includes(retryAllowedErrorMessage);
      }
    );

    // TokenAccountNotFound returning this to users
    // body: {message: {name: "TokenAccountNotFoundError"}, isRetryAllowed: false}
    // Looks like there is no message on the error, rather a name
    if (error instanceof TokenAccountNotFoundError) {
      error.message = 'Token account not found, please try again...';
      isRetryAllowed = true;
    }

    response.status(500).send({
      statusCode: 500,
      body: {
        message: error.message || error.name || error,
        isRetryAllowed,
      },
    });
  }
};

async function handleClaimEgemTokens(request: Request, response: Response) {
  // TODO check the balance on the gem wallet first and throw error is out of gems
  const { walletAddress } = request.body;
  const amount = await getUnclaimedEgemsByWalletAddress(walletAddress);
  const decimalAdjustedAmount = amount * 100;

  console.log(
    `processing started for ${decimalAdjustedAmount} $EGEMS for wallet ${walletAddress}`
  );

  // TODO do not allow payouts - send a res
  if (process.env.IS_CLAIM_ENABLED === 'false') return;

  const connection = new Connection(
    NETWORK_URL,
    CONNECTION_COMMITMENT_LEVEL as Commitment
  );

  const recipientwalletPublicKey = new PublicKey(walletAddress);
  const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
  const { gemWallet } = getServerWallet();

  const associatedDestinationTokenAddress = await getAssociatedTokenAddress(
    mintPublicKey,
    recipientwalletPublicKey
  );

  const receiverAccount = await connection.getAccountInfo(
    associatedDestinationTokenAddress
  );

  const instructions: TransactionInstruction[] = [];

  if (receiverAccount === null) {
    // Add instruction to create new token account
    instructions.push(
      createAssociatedTokenAccountInstruction(
        recipientwalletPublicKey,
        associatedDestinationTokenAddress,
        recipientwalletPublicKey,
        mintPublicKey
      )
    );
  }

  const gemWalletTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    gemWallet,
    mintPublicKey,
    gemWallet.publicKey
  );

  instructions.push(
    createTransferCheckedInstruction(
      gemWalletTokenAccount.address,
      mintPublicKey,
      associatedDestinationTokenAddress,
      gemWallet.publicKey,
      decimalAdjustedAmount,
      SPL_TOKEN_DECIMALS
    )
  );

  const transaction = new Transaction().add(...instructions);
  transaction.feePayer = recipientwalletPublicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.partialSign(gemWallet);

  let serializedTx;

  try {
    serializedTx = transaction.serialize({ requireAllSignatures: false });
  } catch (error) {
    console.log('error', error);
  }

  // TODO create new payout transaction in our db here with a blank hash
  // TODO and return ID in the response so we can match it in finalize
  const payoutTransaction = await createPayoutTransaction({
    walletAddress,
    amount: decimalAdjustedAmount,
    uiAmount: amount,
  });

  response.send({
    statusCode: 200,
    body: {
      message: 'Egem payout started!',
      data: { serializedTx, amount, transactionId: payoutTransaction.id },
    },
  });
}

async function handleFinalizePayoutTransaction(request: Request, response: Response) {
  console.log('finalizing tx...');
  const { serializedTx, amount, transactionId } = request.body;
  const { gemWallet } = getServerWallet();
  const connection = new Connection(NETWORK_URL, 'confirmed');

  const databaseTransaction = await getPayoutTransactionById(transactionId);

  const tempTx = Transaction.from(Buffer.from(serializedTx, 'base64'));
  const payoutReceiptWalletAddress = tempTx.feePayer.toBase58();
  console.log(
    `finalinzing tx for wallet ${payoutReceiptWalletAddress} ${databaseTransaction.receiving_wallet_address} `
  );
  // tempTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  // const serialized2 = tempTx.serialize({ requireAllSignatures: false });
  let txHash;
  try {
    txHash = await sendAndConfirmRawTransaction(connection, serializedTx, {
      maxRetries: 25,
    });

    // TODO here is where i left off...
    const updatedAccount = await updateAccountByWalletAddress(
      payoutReceiptWalletAddress,
      {}
    );

    // SUCCESS
    await updatePayoutTransaction(transactionId, {
      status: 'success',
    });
  } catch (error) {
    console.log('tx error', error);
    if (!txHash) {
      // TODO Tx never even went through - we can log a failed tx here and have the user try again
      console.log('Tx failed with the following error', error);
    }

    if (txHash) {
      await sleep(FAILURE_TIMEOUT_MS);
      const tx = await connection.getTransaction(txHash);

      console.log(
        tx,
        'pre balances \n\n',
        tx?.meta?.preTokenBalances,
        '\n\n post balances',
        tx?.meta?.postTokenBalances
      );

      const preTokenBalance = tx?.meta?.preTokenBalances;
      const postTokenBalance = tx?.meta?.postTokenBalances;

      if (preTokenBalance && postTokenBalance) {
        const preGemWalletTokenBalance = preTokenBalance.find(
          (balance) => balance.owner === gemWallet.publicKey.toString()
        );
        const postGemWalletTokenBalance = postTokenBalance.find(
          (balance) => balance.owner === gemWallet.publicKey.toString()
        );

        const preTxAmount = parseInt(preGemWalletTokenBalance?.uiTokenAmount?.amount);
        const postTxAmount = parseInt(postGemWalletTokenBalance?.uiTokenAmount?.amount);

        if (preTxAmount - postTxAmount !== amount) {
          response.status(500).send({
            statusCode: 500,
            body: {
              message: 'Egem payout failure, please try again!',
              data: txHash,
            },
          });
        } else {
          // Or else success - continue

          await updatePayoutTransaction(transactionId, {
            status: 'success',
          });
        }

        // But this is failure
      } else {
        await updatePayoutTransaction(transactionId, {
          status: 'failure',
        });

        response.status(500).send({
          statusCode: 500,
          body: {
            message: 'Egem payout failure, please try again!',
            data: txHash,
          },
        });
      }
    }
  }

  // TODO db entry
  console.log('db entry');

  response.send({
    statusCode: 200,
    body: {
      message: 'Egem payout successful!',
      data: txHash,
    },
  });
}

// Route assignments
const payoutRouter = Router();
payoutRouter.post(`/payout`, handlePayout);
payoutRouter.post(`/claim`, handleClaimEgemTokens);
payoutRouter.post(`/finalize-transaction`, handleFinalizePayoutTransaction);

export { payoutRouter };
