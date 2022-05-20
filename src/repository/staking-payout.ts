import { add, parseISO, isAfter, formatDistance } from 'date-fns';
import {
  getAllStakedForgeBots,
  updateForgeBot,
  setForgeBotUnstakedAndRemoveLockedAndUnclaimedBalances,
} from './forgebots';
import {
  getCompanionWithTypeById,
  setCompanionAsUnstakedAndUnpaired,
} from './companions';
import { isNftInWallet } from '../utils';
import {
  STAKING_LOCKED_EGEM_PAYOUT_FREQUENCY,
  OVERSEER_DAILY_PAYOUT,
  FORGEBOT_DAILY_PAYOUT,
} from '../constants';

export async function checkAllBotsForPayout() {
  try {
    const checkStartTime = Date.now();

    const stakedBots = await getAllStakedForgeBots();
    console.log('Checking all bots for payout eligibility', stakedBots.length);

    for (const tempForgeBot of stakedBots) {
      console.log(`checking bot ${stakedBots.indexOf(tempForgeBot)}`);
      let bonusPayout = 0;
      let updatedForgeBot;
      const fogetBotPayout = tempForgeBot.is_overseer
        ? parseFloat(OVERSEER_DAILY_PAYOUT)
        : parseFloat(FORGEBOT_DAILY_PAYOUT);
      const linkedCompanionAddress = tempForgeBot.linked_companion;
      const ownerWallet = tempForgeBot.owner_wallet_address;

      // Handle companion case (or falsely linked companion)
      if (tempForgeBot.linked_companion) {
        const isCompanionInWallet = await isNftInWallet({
          walletAddress: ownerWallet,
          nftAddress: linkedCompanionAddress,
        });

        if (isCompanionInWallet) {
          const tempCompanion = await getCompanionWithTypeById(linkedCompanionAddress);
          bonusPayout = tempCompanion?.companion_type?.egem_payout_bonus || 0;
        } else {
          await setCompanionAsUnstakedAndUnpaired(linkedCompanionAddress);
          console.log(
            `Linked Companion ${linkedCompanionAddress}, (previously) owned by ${ownerWallet} violated staking rules and it is no unlinked.`
          );
        }
      }

      const isForgeBotInWallet = await isNftInWallet({
        walletAddress: ownerWallet,
        nftAddress: tempForgeBot.mint_address,
      });

      if (isForgeBotInWallet) {
        const nextPayoutTime = add(
          parseISO(tempForgeBot.last_locked_egem_allocation as string),
          STAKING_LOCKED_EGEM_PAYOUT_FREQUENCY
        );

        console.log('next payout time', nextPayoutTime);
        console.log('current time: ', new Date());

        if (isAfter(new Date(), nextPayoutTime)) {
          // TRIGGER PAYOUT
          updatedForgeBot = await updateForgeBot(tempForgeBot.mint_address, {
            egems_locked_balance:
              tempForgeBot.egems_locked_balance + (bonusPayout + fogetBotPayout),
            last_locked_egem_allocation: new Date(),
          });

          console.log(`ForgeBot ${tempForgeBot.mint_address} eligible for egem earning.`);
        } else {
          console.log(
            `ForgeBot ${tempForgeBot.mint_address} not yet eligible for egem earning, will be in`,
            formatDistance(new Date(), nextPayoutTime)
          );
        }
      } else {
        // Clear the staked stuff
        updatedForgeBot = await setForgeBotUnstakedAndRemoveLockedAndUnclaimedBalances(
          tempForgeBot.mint_address
        );
        console.log(
          `Staked ForgetBot ${tempForgeBot.mint_address}, (previously) owned by ${ownerWallet} violated staking rules and it's balances were reset.`
        );
      }
      console.log('Check complete.');
    }

    console.log(
      'Completed payout and staking check, took ',
      formatDistance(new Date(), checkStartTime)
    );
  } catch (error) {
    console.log(`Error while checking bots for staking eligibility`, error);
  }
}
