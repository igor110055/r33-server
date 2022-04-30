import dotenv from 'dotenv';
dotenv.config();

import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaMetadataAddress } from '@nfteyez/sol-rayz';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

import forgeBots from './forgebots.json';
import { ForgeBot } from '../types';
import { getNftMetadataFromUri } from '../utils';

const NETWORK_URL = process.env.NETWORK_URL;
const connection = new Connection(NETWORK_URL);

// Gets the metadata about the forgebot and uses that to
// Create a format that our database expects
async function formatForgeBot(forgeBotMintAddress: string): Promise<ForgeBot> {
  const mintPubKey = new PublicKey(forgeBotMintAddress);
  const metaDataAccountAddress = await getSolanaMetadataAddress(mintPubKey);
  const tokenMeta = await Metadata.fromAccountAddress(connection, metaDataAccountAddress);
  const tempMetaDataUri = tokenMeta?.data?.uri?.replace?.(/\0/g, '');

  const metadata = await getNftMetadataFromUri(tempMetaDataUri);

  console.log({
    tokenMeta,
    tempMetaDataUri,
    metadata,
    attributes: metadata?.attributes,
  });

  const isOverseer = metadata?.attributes.some(
    (tempAttribute) => tempAttribute.value === 'Overseer'
  );

  console.log('is overseer', isOverseer);

  return {
    mint_address: forgeBotMintAddress,
    egems_total_claimed: 0,
    egems_unclaimed_balance: 0,
    is_overseer: isOverseer,
    is_staked: false,
    image_url: metadata?.image,
  };
}

function run() {
  console.log(`forgebot mint address: ${forgeBots[0]}`);
  formatForgeBot(forgeBots[0]);
  // formatForgeBot('9hMemsa1KbqQLacuBy1aUWHWtgEQRmXmpimc5tR17CoX');
}

run();
