import { Router } from 'express';

import { Route } from '../../constants';
import { payoutRouter } from './payout';
import { nftRouter } from './nft-validation';
import { healthCheckRouter } from './health-check';

const v1Router = Router();

v1Router.use(Route.Transactions, payoutRouter);
v1Router.use(Route.Nft, nftRouter);
v1Router.use(Route.HealthCheck, healthCheckRouter);

export { v1Router };
