import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
import { NFT } from '../types';

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);

// ID is same as the NFT Address
export async function getNftById(id: string) {
  const { data: nftData, error } = await supabase.from<NFT>('nfts').select('*').eq('id', id);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving NFT by ID DB: ${error.message} `);
  }

  return nftData[0];
}

export async function updateNftById(id: string, updatedNftData: Partial<NFT>) {
  const { data, error } = await supabase
    .from<NFT>('nfts')
    .update({
      ...updatedNftData,
    })
    .match({ id });

  if (error) {
    console.error(error);
    throw Error(`Error updating NFT Data in DB: ${error.message}`);
  }

  return data;
}

export async function addNft(nft: Omit<NFT, 'created_at'>) {
  const { data, error } = await supabase.from<NFT>('nfts').insert([
    {
      ...nft,
    },
  ]);

  if (error) {
    console.error(error);
    throw Error(`Error adding new NFT to DB: ${error.message}`);
  }

  return data;
}
