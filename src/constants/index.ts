import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

export enum Route {
  Transactions = '/transactions',
  Nft = '/nft',
  V1 = '/v1',
  HealthCheck = '/health-check',
  Account = '/account',
  Staking = '/staking',
  Authentication = '/authentication',
  TokenAccount = '/token-account',
}

// Seeding constants
export const META_DATA_REQUEST_DELAY_MS = 125;
export const AFTER_THROTTLE_DELAY_MS = 30000;

// NFT Constants
export const NFT_SYMBOL = process.env.NFT_SYMBOL;
export const NFT_COMPANION_SYMBOL = process.env.NFT_COMPANION_SYMBOL;
export const UPDATE_AUTHORITY_ADDRESS = process.env.UPDATE_AUTHORITY_ADDRESS;
export const FIRST_CREATOR = process.env.FIRST_CREATOR;
export const COMPANION_CREATOR = process.env.COMPANION_CREATOR;

// Wallet constants
export const WALLET_SEED_PHRASE = process.env.WALLET_SEED_PHRASE;
export const WALLET_PASS_PHRASE = process.env.WALLET_PASS_PHRASE;

// Network
export const NETWORK_URL = process.env.NETWORK_URL;
export const connection = new Connection(NETWORK_URL);
export const confirmedConnection = new Connection(NETWORK_URL, 'confirmed');
export const finalizedConnection = new Connection(NETWORK_URL, 'finalized');
export const processedConnection = new Connection(NETWORK_URL, 'processed');
