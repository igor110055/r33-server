export type NFT = {
  id: string;
  created_at: Date | string;
  last_payout: Date | string;
  total_payout: number;
  total_payout_for_ui: number;
  wallet_owner: string;
  network: string;
};

export type Wallet = {
  id: string;
  created_at: Date | string;
  last_payout: Date | string;
  total_payout: number;
  total_payout_for_ui: number;
  network: string;
};
