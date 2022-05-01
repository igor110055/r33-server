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

export type ForgeBot = {
  mint_address: string;
  owner_wallet_address?: string;
  linked_companion?: Companion;
  egems_unclaimed_balance: number;
  egems_total_claimed: number;
  is_overseer: boolean;
  is_staked: boolean;
  image_url?: string;
  attributes?: any; // TODO type this appropriately
  name?: string;
};

export type Companion = {
  mint_address: string;
  owner_wallet_address?: string;
  companion_type?: CompanionType;
  linked_forgebot?: ForgeBot;
  is_staked?: boolean;
  image_url?: string;
};

export type Account = {
  wallet_address: string;
  last_access: Date | string;
  egem_unclaimed_balance: number;
  egem_claimed_balance: number;
  image_url?: string;
};

export type CompanionType = {
  id: number;
  name: string;
  egem_payout_bonus: number;
  display_name: string;
};
