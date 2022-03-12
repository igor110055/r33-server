import { createClient } from '@supabase/supabase-js';
import { add, parseISO, isAfter, formatDistance } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();
import { NFT, Wallet } from '../types';

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);

// Offset to make the tokens into whole digits
const SPL_TOKEN_DECIMAL_MULTIPLIER = parseInt(process.env.SPL_TOKEN_DECIMAL_MULTIPLIER);
const PAYOUT_COOLDOWN = JSON.parse(process.env.PAYOUT_COOLDOWN);
const NETWORK = process.env.NETWORK;

export async function handleNftCooldown(
  nftAddress: string,
  payoutAmount: number,
  receivingWalletAddress: string
) {
  const { data: nftData, error: nftDbError } = await supabase
    .from<NFT>('nfts')
    .select('*')
    .eq('id', nftAddress);

  const dbNft = nftData[0];
  console.log(`nft data:`, nftData);

  let dbNftRes;
  if (dbNft) {
    console.log('found existing nft', dbNft);
    const nextPayoutTime = add(parseISO(dbNft.last_payout as string), PAYOUT_COOLDOWN);
    console.log(dbNft.last_payout, typeof dbNft.last_payout);
    console.log(new Date(), ' >= ', nextPayoutTime, isAfter(new Date(), nextPayoutTime));
    if (isAfter(new Date(), nextPayoutTime)) {
      // payout
      const { data: dbData, error: dbError } = await supabase
        .from<NFT>('nfts')
        .update({
          total_payout: dbNft.total_payout + payoutAmount,
          total_payout_for_ui: (dbNft.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
          last_payout: new Date(),
          wallet_owner: receivingWalletAddress,
        })
        .match({ id: nftAddress });

      if (dbError) {
        console.error(`nft db error: ${dbError.message}`);
      } else {
        dbNftRes = dbData;
      }
    } else {
      // Don't payout...
      const timeToWaitString = formatDistance(nextPayoutTime, new Date());
      throw Error(`Payout not eligible for this NFT, please wait ${timeToWaitString}...`);
    }
  } else {
    // Add new NFT to the db
    const { data: dbData, error: dbError } = await supabase.from<NFT>('nfts').insert([
      {
        id: nftAddress,
        last_payout: new Date(),
        wallet_owner: receivingWalletAddress,
        total_payout: payoutAmount,
        total_payout_for_ui: payoutAmount / SPL_TOKEN_DECIMAL_MULTIPLIER,
        network: NETWORK,
      },
    ]);

    if (dbError) {
      console.error(`db error: ${dbError.message}`);
    } else {
      dbNftRes = dbData;
    }
  }

  return dbNftRes;
}

export async function handleWalletCooldown(receivingWalletAddress: string, payoutAmount: number) {
  console.log('expected payout', payoutAmount);
  const { data: walletData, error: walletDbError } = await supabase
    .from<Wallet>('wallets')
    .select('*')
    .eq('id', receivingWalletAddress);

  if (walletDbError) {
    console.log('error getting wallet from db', walletDbError);
  }

  const dbWallet = walletData[0];

  if (dbWallet) {
    // Wallet already exists in our system
    const nextPayoutTime = add(parseISO(dbWallet.last_payout as string), PAYOUT_COOLDOWN);
    if (isAfter(new Date(), nextPayoutTime)) {
      const { data: dbData, error: dbError } = await supabase
        .from<Wallet>('wallets')
        .update({
          total_payout: dbWallet.total_payout + payoutAmount,
          total_payout_for_ui:
            (dbWallet.total_payout + payoutAmount) / SPL_TOKEN_DECIMAL_MULTIPLIER,
          last_payout: new Date(),
        })
        .match({ id: receivingWalletAddress });
      if (dbError) {
        console.log('database error updating wallet...', dbError);
      } else {
        return dbData;
      }
    } else {
      // TODO don't payout
      const timeToWaitString = formatDistance(nextPayoutTime, new Date());
      throw Error(`This wallet is still on cooldown... please wait ${timeToWaitString}`);
    }
  } else {
    // Wallet does not exist, create one plz
    const { data: dbData, error: dbError } = await supabase.from<Wallet>('wallets').insert([
      {
        id: receivingWalletAddress,
        last_payout: new Date(),
        total_payout: payoutAmount,
        total_payout_for_ui: payoutAmount / SPL_TOKEN_DECIMAL_MULTIPLIER,
        network: NETWORK,
      },
    ]);
    if (dbError) {
      console.log('Database error creating new wallet to track', dbError);
    } else {
      return dbData;
    }
  }
  return null;
}
