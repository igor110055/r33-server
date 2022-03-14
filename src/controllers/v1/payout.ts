// TODO https://www.quicknode.com/guides/web3-sdks/how-to-mint-an-nft-on-solana
// TODO mint some spl tokens :point-up: to use
// TODO also this: https://spl.solana.com/token

// TODO retry TXs if they fail: https://solanacookbook.com/guides/retrying-transactions.html#before-a-transaction-is-processed

import { Router, Request, Response, NextFunction } from 'express';
import { mnemonicToSeedSync } from 'bip39';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, getAccount, transfer } from '@solana/spl-token';

import { handleWalletCooldown, handleNftCooldown } from '../../utils';
import { validateWalletAddress, isWalletAuthenticated } from '../../utils/wallet-utils';

// Offset to make the tokens into whole digits
const SPL_TOKEN_DECIMAL_MULTIPLIER = parseInt(process.env.SPL_TOKEN_DECIMAL_MULTIPLIER);

// Transaction Constants
const NETWORK_URL = process.env.NETWORK_MAINNET_URL;
const MAX_PAYOUT_ALLOWED = process.env.MAX_PAYOUT_ALLOWED;
const WALLET_SEED_PHRASE = process.env.WALLET_SEED_PHRASE;
const WALLET_PASS_PHRASE = process.env.WALLET_PASS_PHRASE;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
const TOKEN_ACCOUNT_ADDRESS = process.env.TOKEN_ACCOUNT_ADDRESS;
const NFT_AUTHENTICATED_PAYOUT =
  parseInt(process.env.NFT_AUTHENTICATED_PAYOUT) * SPL_TOKEN_DECIMAL_MULTIPLIER;
const NON_AUTHENTICATED_PAYOUT =
  parseInt(process.env.NON_AUTHENTICATED_PAYOUT) * SPL_TOKEN_DECIMAL_MULTIPLIER;

const handlePayout = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { receivingWalletAddress, amount, source, nftAddress } = request.body;
    console.log({ receivingWalletAddress, amount, source, nftAddress });

    if (amount > MAX_PAYOUT_ALLOWED) {
      throw new Error('Attempted to exceed maximum payout!');
    }

    const gemWalletSeed = mnemonicToSeedSync(WALLET_SEED_PHRASE, WALLET_PASS_PHRASE).slice(0, 32);
    const gemWallet = Keypair.fromSeed(gemWalletSeed);
    const gemWalletPublicKey = new PublicKey(gemWallet.publicKey);
    const recievingAddress = new PublicKey(receivingWalletAddress);

    console.log('recieving public key', recievingAddress);

    console.log(NETWORK_URL);
    const connection = new Connection(NETWORK_URL, 'confirmed');

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

    console.log(`payoutAmount ${payoutAmount} > token account amount ${tokenAccount.amount}`);

    if (payoutAmount > tokenAccount.amount) {
      // TODO notify admins that we're out of tokens! (sms? email? discord notif?)
      throw new Error(`Out of gems today! ${tokenAccount.amount} gems remain.`);
    }

    // DB section — keeping track of our current cooldowns
    let dbWalletRes;
    let dbNftRes;

    if (isAuthenticated) {
      dbNftRes = await handleNftCooldown(nftAddress, payoutAmount, receivingWalletAddress);
    } else {
      dbWalletRes = await handleWalletCooldown(receivingWalletAddress, payoutAmount);
    }

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      gemWallet,
      mintPublicKey,
      recievingAddress
    );

    console.log('to account address', toTokenAccount.address);
    // console.log({
    //   connection,
    //   gemWallet,
    //   tokenAccountPublicKey,
    //   toTokenAccountAddress: toTokenAccount.address,
    //   getWalletPublicKey: gemWallet.publicKey,
    //   payoutAmount,
    // });

    const txHash = await transfer(
      connection,
      gemWallet,
      tokenAccountPublicKey,
      toTokenAccount.address,
      gemWallet.publicKey,
      payoutAmount
    );

    const data = {
      receivingWalletAddress,
      currentGemBalance: tokenAccount.amount.toString(),
      amountPaidOut: payoutAmount,
      source,
      gemWallet: gemWallet.publicKey.toBase58(),
      transactionHash: txHash,
      dbNftData: dbNftRes,
    };

    console.log(data);
    response.send({
      statusCode: 200,
      body: {
        message: 'Egem payout successful!',
        data,
      },
    });
  } catch (error) {
    response.send({
      statusCode: 500,
      body: {
        message: error.message || error,
      },
    });
  }
};

// Route assignments
const payoutRouter = Router();
payoutRouter.post(`/payout`, handlePayout);

export { payoutRouter };
