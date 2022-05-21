import { Account } from '../types';

export function generateNewAccountObject(walletAddress: string): Account {
  return {
    wallet_address: walletAddress,
    egem_unclaimed_balance: 0,
    egem_claimed_balance: 0,
    last_access: new Date(),
  };
}
