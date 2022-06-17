import { Account } from '../types';

export function generateNewAccountObject(walletAddress: string): Account {
  return {
    wallet_address: walletAddress,
    egem_unclaimed_balance: 0,
    total_egems_claimed: 0,
    last_access: new Date(),
    updated_at: new Date(),
  };
}
