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
  linked_companion?: string | Companion;
  egems_unclaimed_balance: number;
  egems_locked_balance: number;
  egems_total_claimed: number;
  is_overseer: boolean;
  is_staked: boolean;
  image_url?: string;
  attributes?: Attribute[];
  name?: string;
  updated_at?: Date;
  last_locked_egem_allocation?: Date;
};

export type Companion = {
  mint_address: string;
  owner_wallet_address?: string;
  companion_type?: CompanionType;
  linked_forgebot?: string;
  is_staked?: boolean;
  image_url?: string;
  attributes?: Attribute[];
  name?: string;
  avatar_asset_url?: string;
  updated_at?: Date;
};

type Attribute = {
  trait_type: string;
  value: string;
};

export type Account = {
  wallet_address: string;
  last_access: Date | string;
  egem_unclaimed_balance: number;
  egem_claimed_balance: number;
  image_url?: string;
  updated_at: Date | string;
};

export type CompanionType = {
  id: number;
  name: string;
  egem_payout_bonus: number;
  display_name: string;
  ui_color: string;
};

export type PayoutTransaction = {
  id: number;
  receiving_wallet_address: string;
  payout_amount: number;
  ui_payout_amount: number;
  tx_hash: string | null;
  status: 'incomplete' | 'unknown' | 'success' | 'failure';
  created_at: Date | string;
  updated_at: Date | string;
};
