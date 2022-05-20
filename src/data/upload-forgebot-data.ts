import dotenv from 'dotenv';
dotenv.config();

import forgeBots from './forgebots.json';
import { addForgeBot } from '../repository/forgebots';
import { ForgeBot } from '../types';
import { getNftMetaDataFromTokenAddress, sleep } from '../utils';

const META_DATA_REQUEST_DELAY_MS = 125;
const AFTER_THROTTLE_DELAY_MS = 30000;

// Gets the metadata about the forgebot and uses that to
// Create a format that our database expects
async function formatForgeBot(
  forgeBotMintAddress: string,
  isLoggingEnabled: boolean = false
): Promise<ForgeBot> {
  const metadata = await getNftMetaDataFromTokenAddress(forgeBotMintAddress);

  if (isLoggingEnabled) {
    console.log({
      // tokenMetaData,
      // tempMetaDataUri,
      metadata,
      // attributes: metadata?.attributes,
    });
  }

  const isOverseer = metadata?.attributes.some(
    (tempAttribute) => tempAttribute.value === 'Overseer'
  );

  return {
    mint_address: forgeBotMintAddress,
    egems_total_claimed: 0,
    egems_unclaimed_balance: 0,
    egems_locked_balance: 0,
    is_overseer: isOverseer,
    is_staked: false,
    image_url: metadata?.image,
    attributes: metadata?.attributes,
    name: metadata?.name,
  };
}

const seedFbData = async (indexToStartAt?: number) => {
  let formattedForgeBotData: ForgeBot[] = [];
  let currentBotIndex = indexToStartAt ?? 0;

  for (const tempForgeBot of forgeBots) {
    if (forgeBots.indexOf(tempForgeBot) !== currentBotIndex) {
      // Keep moving if this index isn't the right one
      continue;
    }

    try {
      const formattedForgeBot = await formatForgeBot(tempForgeBot);
      const result = await addForgeBot(formattedForgeBot);

      // formattedForgeBotData.push(formattedForgeBot);

      console.log(
        `fb: ${currentBotIndex} / ${forgeBots.length} formatted ${formattedForgeBot.name}... bucketsize ${formattedForgeBotData.length} `
      );

      currentBotIndex++;
    } catch (error) {
      console.log(error);

      // To avoid throttling...
      await sleep(AFTER_THROTTLE_DELAY_MS);
      seedFbData(currentBotIndex);
      return;
    }

    // To avoid throttling...
    await sleep(META_DATA_REQUEST_DELAY_MS);
  }

  console.log(`\n\n UPLOAD COMPLETE... \n\n`);
};

seedFbData();
