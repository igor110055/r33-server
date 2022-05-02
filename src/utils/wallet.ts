import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import { resolveToWalletAddress, getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';
import { mnemonicToSeedSync } from 'bip39';
import { isValidForgebotNft } from './nfts';

import { WALLET_PASS_PHRASE, WALLET_SEED_PHRASE } from '../constants';

export const validateWalletAddress = async (address: string, connection: Connection) => {
  try {
    return await resolveToWalletAddress({ text: address, connection });
  } catch (error) {
    throw Error(`Wallet address is not valid: ${error.message}`);
  }
};

export async function isWalletAuthenticated({
  walletAddress,
  nftAddress,
  connection,
}): Promise<boolean> {
  const walletNfts = await getParsedNftAccountsByOwner({
    publicAddress: walletAddress,
    connection,
  });

  const nft = walletNfts.find((nft) => nft.mint === nftAddress);

  if (nft) {
    return isValidForgebotNft(nft);
  } else {
    return false;
  }
}

export async function isNftInWallet({
  walletAddress,
  nftAddress,
  connection,
}): Promise<boolean> {
  const walletNfts = await getParsedNftAccountsByOwner({
    publicAddress: walletAddress,
    connection,
  });

  const nft = walletNfts.find((nft) => nft.mint === nftAddress);
  return nft ? true : false;
}

export function walletSeedUint8Array(seedString) {
  const json = JSON.parse(seedString);
  return Uint8Array.from(json.slice(0, 32));
}

export function getServerWallet() {
  const gemWalletSeed = mnemonicToSeedSync(WALLET_SEED_PHRASE, WALLET_PASS_PHRASE).slice(
    0,
    32
  );
  const gemWallet = Keypair.fromSeed(gemWalletSeed);
  const gemWalletPublicKey = new PublicKey(gemWallet.publicKey);

  return {
    gemWallet,
    gemWalletPublicKey,
  };
}
