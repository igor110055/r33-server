import axios from 'axios';

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
  return (
    nft.data.symbol === NFT_COMPANION_SYMBOL &&
    nft.updateAuthority === UPDATE_AUTHORITY_ADDRESS &&
    nft.data?.creators[0]?.address === COMPANION_CREATOR
  );
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
      case 'Orage':
        return companionTypeIds.uncommonOrange;
      default:
        return companionTypeIds.uncommonOrange;
    }
  } else {
    const tempRarity = tempName.split(' ')[0];
    console.log('rarity', tempRarity);
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
    image: tempCompanionNft.metadata.image,
    model: tempCompanionNft.metadata.animation_url,
    companionTypeId: getCompanionTypeId(tempCompanionNft),
  };
}
