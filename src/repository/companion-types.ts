import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { CompanionType } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABSE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'companion_types';

export async function getCompanionTypes() {
  const { data: companionTypeData, error } = await supabase
    .from<CompanionType>(DATABASE_TABLE_NAME)
    .select('*');

  if (error) {
    console.error(error);
    throw Error(`Error retrieving NFT by ID DB: ${error.message} `);
  }

  return companionTypeData;
}

export async function getCompanionTypeById(id: number) {
  const { data: companionTypeData, error } = await supabase
    .from<CompanionType>(DATABASE_TABLE_NAME)
    .select('*')
    .eq('id', id);

  if (error) {
    console.error(error);
    throw Error(`Error retrieving NFT by ID DB: ${error.message} `);
  }

  return companionTypeData[0];
}
