import { createClient } from '@supabase/supabase-js';

import {
  SUPABASE_DB_KEY,
  SUPABASE_URL,
  FORGEBOT_DAILY_PAYOUT,
  OVERSEER_DAILY_PAYOUT,
} from '../constants';
import { ForgeBot, Companion, CompanionType } from '../types';

const supabase = createClient(SUPABASE_URL, SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'forgebots';

const forgeBotSchemaWithCompanion = `
mint_address,
created_at,
owner_wallet_address,
egems_unclaimed_balance,
egems_total_claimed,
egems_locked_balance,
linked_companion: companions!forgebots_linked_companion_fkey(
  mint_address,
  created_at,
  owner_wallet_address,
  companion_type: companion_types(
    id,
    name,
    egem_payout_bonus,
    display_name
  ),
  is_staked,
  image_url,
  attributes,
  name,
  avatar_asset_url,
  updated_at
),
image_url,
is_staked,
is_overseer,
attributes,
name,
updated_at
`;

export async function getPorfolioEarningData(onwerWalletAddress: string) {
  const { data: forgeBotData, error } = await supabase
    .from<ForgeBot>(DATABASE_TABLE_NAME)
    .select(forgeBotSchemaWithCompanion)
    .eq('owner_wallet_address', onwerWalletAddress);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving ForgeBot by Mint Address DB: ${error.message} `);
  }

  const stakedBots = forgeBotData.filter((tempForgeBot) => tempForgeBot.is_staked);

  const dailyEarningRate = stakedBots.reduce((dailyEarningValue, currentBot) => {
    const basePayout = parseInt(
      currentBot.is_overseer ? OVERSEER_DAILY_PAYOUT : FORGEBOT_DAILY_PAYOUT
    );

    const tempCompanion: Companion = currentBot.linked_companion as Companion;
    if (tempCompanion) {
      return (
        dailyEarningValue + (basePayout + tempCompanion.companion_type.egem_payout_bonus)
      );
    } else return dailyEarningValue + basePayout;
  }, 0);

  const egemLockedBalance = forgeBotData.reduce((lockedBalance, currentBot) => {
    return lockedBalance + currentBot.egems_locked_balance;
  }, 0);

  const egemUnclaimedBalance = forgeBotData.reduce((unclaimedBalance, currentBot) => {
    return unclaimedBalance + currentBot.egems_unclaimed_balance;
  }, 0);

  return { dailyEarningRate, egemLockedBalance, egemUnclaimedBalance };
}
