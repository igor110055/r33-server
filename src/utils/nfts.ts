import dotenv from 'dotenv';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaMetadataAddress } from '@nfteyez/sol-rayz';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

dotenv.config();

const NETWORK_URL = process.env.NETWORK_URL;

// Processed commitment as these are read only situations
const connection = new Connection(NETWORK_URL, 'processed');

import {
  NFT_SYMBOL,
  NFT_COMPANION_SYMBOL,
  UPDATE_AUTHORITY_ADDRESS,
  FIRST_CREATOR,
  COMPANION_CREATOR,
} from '../constants';

export function isValidForgeBotNft(nft) {
  return (
    nft.data.symbol === NFT_SYMBOL &&
    nft.updateAuthority === UPDATE_AUTHORITY_ADDRESS &&
    nft.data?.creators[0]?.address === FIRST_CREATOR
  );
}

export function isValidCompanionNft(nft) {
  return (
    nft.data.symbol === NFT_COMPANION_SYMBOL &&
    nft.updateAuthority === UPDATE_AUTHORITY_ADDRESS &&
    nft.data?.creators[0]?.address === COMPANION_CREATOR
  );
}

export async function getNftMetaDataFromTokenAddress(tokenMintAddress) {
  const mintPubKey = new PublicKey(tokenMintAddress);
  const metaDataAccountAddress = await getSolanaMetadataAddress(mintPubKey);
  const tokenMetaData = await Metadata.fromAccountAddress(
    connection,
    metaDataAccountAddress
  );

  // Clean all the junk off the end of the URL
  const tempMetaDataUri = tokenMetaData?.data?.uri?.replace?.(/\0/g, '');

  const metadata = await getNftMetadataFromUri(tempMetaDataUri);

  return metadata;
}

export async function getNftMetadata(nft) {
  try {
    const response = await axios.get(nft.data.uri);

    // const ownedMetadata = await Metadata.load(connection, nft.mint);
    // console.log(response.data);
    return { ...nft, metadata: response.data };
  } catch (error) {
    console.log('Failed to fetch metadata', error);
  }
}

export async function getNftMetadataFromUri(uri) {
  try {
    const response = await axios.get(uri);
    return response.data;
  } catch (error) {
    console.log('Failed to fetch metadata', error);
  }
}

const companionTypeIds = {
  commonWhite: 'common_white',
  commonRed: 'common_red',
  commonBlue: 'common_blue',
  uncommonOrange: 'uncommon_orange',
  uncommonTeal: 'uncommon_teal',
  rare: 'rare',
  epic: 'epic',
  mythic: 'mythic',
  legendary: 'legendary',
};

export function getCompanionTypeId(companionNft) {
  const tempName = companionNft.metadata.name;
  const tempColor = companionNft.metadata.attributes.find(
    (attribute) => attribute.trait_type === 'Body Color'
  )?.value;

  if (tempName.includes('Common')) {
    switch (tempColor) {
      case 'White':
        return companionTypeIds.commonWhite;
      case 'Red':
        return companionTypeIds.commonRed;
      case 'Blue':
        return companionTypeIds.commonBlue;
      default:
        return companionTypeIds.commonWhite;
    }
  } else if (tempName.includes('Uncommon')) {
    switch (tempColor) {
      case 'Teal':
        return companionTypeIds.uncommonTeal;
      case 'Orange':
        return companionTypeIds.uncommonOrange;
      default:
        return companionTypeIds.uncommonOrange;
    }
  } else {
    const tempRarity = tempName.split(' ')[0];
    return companionTypeIds[tempRarity.toLowerCase()];
  }
}

export function formatCompanionNft(tempCompanionNft) {
  return {
    mint: tempCompanionNft.mint,
    name: tempCompanionNft.metadata.name,
    color: tempCompanionNft.metadata.attributes.find(
      (attribute) => attribute.trait_type === 'Body Color'
    )?.value,
    imageUri: tempCompanionNft.metadata.image,
    modelUri: tempCompanionNft.metadata.animation_url,
    typeId: getCompanionTypeId(tempCompanionNft),
  };
}
