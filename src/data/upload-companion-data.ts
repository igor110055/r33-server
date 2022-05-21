import dotenv from 'dotenv';
dotenv.config();

import companionHashList from './companions.json';
import { addCompanion, getCompanionTypes, getCompanionTypeById } from '../repository';
import { Companion } from '../types';
import { getNftMetaDataFromTokenAddress, sleep } from '../utils';
import { META_DATA_REQUEST_DELAY_MS, AFTER_THROTTLE_DELAY_MS } from '../constants';

let companionTypes;

// Gets the metadata about the forgebot and uses that to
// Create a format that our database expects
async function formatCompanion(
  companionMintAddress: string,
  isLoggingEnabled: boolean = false
): Promise<Companion> {
  if (!companionTypes) {
    companionTypes = await getCompanionTypes();
  }

  const metadata = await getNftMetaDataFromTokenAddress(companionMintAddress);

  if (isLoggingEnabled) {
    console.log({
      // tokenMetaData,
      // tempMetaDataUri,
      metadata,
      // attributes: metadata?.attributes,
    });
  }

  const companionTypeId = companionTypes.find(
    (tempType) => tempType.display_name === metadata?.name
  ).id;

  return {
    mint_address: companionMintAddress,
    is_staked: false,
    companion_type: companionTypeId,
    image_url: metadata?.image,
    attributes: metadata?.attributes,
    name: metadata?.name,
    avatar_asset_url: metadata?.animation_url,
  };
}

const seedCompanionData = async (indexToStartAt?: number) => {
  let currentCompanionIndex = indexToStartAt ?? 0;
  // const tempCompanion = await formatCompanion(companionHashList[0], true);
  // console.log(tempCompanion);

  for (const tempCompanion of companionHashList) {
    if (companionHashList.indexOf(tempCompanion) !== currentCompanionIndex) {
      // Keep moving if this index isn't the right one
      continue;
    }

    try {
      const formattedForgeBot = await formatCompanion(tempCompanion);
      const result = await addCompanion(formattedForgeBot);

      console.log(
        `companion: ${currentCompanionIndex} / ${companionHashList.length} formatted ${formattedForgeBot.name}... `
      );

      currentCompanionIndex++;
    } catch (error) {
      console.log(error);

      // To avoid throttling...
      await sleep(AFTER_THROTTLE_DELAY_MS);
      seedCompanionData(currentCompanionIndex);
      return;
    }

    // To avoid throttling...
    await sleep(META_DATA_REQUEST_DELAY_MS);
  }

  console.log(`\n\n UPLOAD COMPLETE... \n\n`);
};

seedCompanionData();
