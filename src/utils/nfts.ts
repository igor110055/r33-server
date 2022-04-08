import {
  NFT_SYMBOL,
  NFT_COMPANION_SYMBOL,
  UPDATE_AUTHORITY_ADDRESS,
  FIRST_CREATOR,
  COMPANION_CREATOR,
} from '../constants';

export async function isValidForgebotNft(nft) {
  return (
    nft.data.symbol === NFT_SYMBOL &&
    nft.updateAuthority === UPDATE_AUTHORITY_ADDRESS &&
    nft.data?.creators[0]?.address === FIRST_CREATOR
  );
}

export function isValidCompanionNft(nft) {
  console.log(
    `symbol (${NFT_COMPANION_SYMBOL}) === `,
    nft.data.symbol,
    `update auth (${UPDATE_AUTHORITY_ADDRESS})`,
    nft.updateAuthority,
    `companion creator (${COMPANION_CREATOR})`,
    nft.data?.creators[0]?.address,
    '\n\n'
  );
  return (
    nft.data.symbol === NFT_COMPANION_SYMBOL &&
    nft.updateAuthority === UPDATE_AUTHORITY_ADDRESS &&
    nft.data?.creators[0]?.address === COMPANION_CREATOR
  );
}
