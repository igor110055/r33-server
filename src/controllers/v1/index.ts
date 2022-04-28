import { Router } from 'express';

import { Route } from '../../constants';
import { payoutRouter } from './payout';
import { nftRouter } from './nft-validation';
import { healthCheckRouter } from './health-check';
import { accountRouter } from './create-token-account';
import { stakingRouter } from './staking';
import { authRouter } from './auth';

const v1Router = Router();

v1Router.use(Route.Transactions, payoutRouter);
v1Router.use(Route.Nft, nftRouter);
v1Router.use(Route.HealthCheck, healthCheckRouter);
v1Router.use(Route.Account, accountRouter);
v1Router.use(Route.Staking, stakingRouter);
v1Router.use(Route.Authentication, authRouter);

export { v1Router };
