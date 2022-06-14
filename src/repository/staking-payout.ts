import { add, parseISO, isAfter, formatDistance } from 'date-fns';
import {
  getAllStakedForgeBots,
  updateForgeBot,
  setForgeBotUnstakedAndRemoveLockedAndUnclaimedBalances,
} from './forgebots';
import {
  getCompanionWithTypeById,
  setCompanionAsUnstakedAndUnpaired,
  updateCompanionByMintAddress,
} from './companions';
import { isNftInWallet } from '../utils';
import {
  STAKING_LOCKED_EGEM_PAYOUT_FREQUENCY,
  OVERSEER_DAILY_PAYOUT,
  FORGEBOT_DAILY_PAYOUT,
} from '../constants';
import { ForgeBot } from '../types';

export async function checkAllBotsForPayout() {
  try {
    const checkStartTime = Date.now();

    const stakedBots = await getAllStakedForgeBots();
    console.log('Checking all bots for payout eligibility', stakedBots.length);

    // Checking bots one at a time...
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
        // Checking if the companion is still in wallet
        const isCompanionInWallet = await isNftInWallet({
          walletAddress: ownerWallet,
          nftAddress: linkedCompanionAddress,
        });

        // TODO Check if companion is still linked to the bot (from the bot)
        // TODO _and_ companions perspective. This will reduce possibility of
        // TODO companions being linked twice

        if (isCompanionInWallet) {
          const tempCompanion = await getCompanionWithTypeById(linkedCompanionAddress);
          bonusPayout = tempCompanion?.companion_type?.egem_payout_bonus || 0;
        } else {
          await setCompanionAsUnstakedAndUnpaired(linkedCompanionAddress);
          await updateCompanionByMintAddress(linkedCompanionAddress, {
            owner_wallet_address: null,
          });

          console.log(
            `Linked Companion ${linkedCompanionAddress}, (previously) owned by ${ownerWallet} violated staking rules and it is now unlinked.`
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

// Basically the same, but we unlock egems instead of paying out to the locked balance
export async function unlockEgems() {
  try {
    const checkStartTime = Date.now();

    const stakedBots: ForgeBot[] = await getAllStakedForgeBots();
    console.log('Checking all bots for unlock eligibility', stakedBots.length);

    for (const tempForgeBot of stakedBots) {
      let updatedForgeBot;
      const ownerWallet = tempForgeBot.owner_wallet_address;

      const isForgeBotInWallet = await isNftInWallet({
        walletAddress: ownerWallet,
        nftAddress: tempForgeBot.mint_address,
      });

      const newUnclaimedBalance =
        tempForgeBot.egems_unclaimed_balance + tempForgeBot.egems_locked_balance;

      console.log(
        'new unclaimed balance',
        newUnclaimedBalance,
        tempForgeBot.egems_unclaimed_balance,
        tempForgeBot.egems_locked_balance
      );

      if (isForgeBotInWallet) {
        updatedForgeBot = await updateForgeBot(tempForgeBot.mint_address, {
          egems_locked_balance: 0,
          egems_unclaimed_balance: newUnclaimedBalance,
        });

        console.log(`Unlocking gems for ${tempForgeBot.mint_address}`);
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
      'Completed egem unlock took ',
      formatDistance(new Date(), checkStartTime)
    );
  } catch (error) {
    console.log(`Error while checking bots for egem unlock eligibility`, error);
  }
}
