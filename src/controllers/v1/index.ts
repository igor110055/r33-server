import { Router } from 'express';

import { Route } from '../../constants';
import { payoutRouter } from './payout';
import { nftRouter } from './nft-validation';

const v1Router = Router();

v1Router.use(Route.Transactions, payoutRouter);
v1Router.use(Route.Nft, nftRouter);

export { v1Router };
