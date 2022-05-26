import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { PayoutReceipt } from '../types';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_DB_KEY);
const DATABASE_TABLE_NAME = 'payout_receipts';

// TODO create
// TODO get
// TODO update
