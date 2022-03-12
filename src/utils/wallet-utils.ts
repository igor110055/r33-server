import { Connection } from '@solana/web3.js';
import { resolveToWalletAddress, getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';

// NFT Constants
const NFT_SYMBOL = process.env.NFT_SYMBOL;
const UPDATE_AUTHORITY_ADDRESS = process.env.UPDATE_AUTHORITY_ADDRESS;
const FIRST_CREATOR = process.env.FIRST_CREATOR;

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
    return isNftValid(nft);
  } else {
    return false;
  }
}

export async function isNftInWallet({ walletAddress, nftAddress, connection }): Promise<boolean> {
  const walletNfts = await getParsedNftAccountsByOwner({
    publicAddress: walletAddress,
    connection,
  });

  const nft = walletNfts.find((nft) => nft.mint === nftAddress);
  return nft ? true : false;
}

// A valid NFT in this case is just one that if from a particular collection
export async function isNftValid(nft) {
  return (
    nft.data.symbol === NFT_SYMBOL &&
    nft.updateAuthority === UPDATE_AUTHORITY_ADDRESS &&
    nft.data?.creators[0]?.address === FIRST_CREATOR
  );
}

export function walletSeedUint8Array(seedString) {
  const json = JSON.parse(seedString);
  return Uint8Array.from(json.slice(0, 32));
}
