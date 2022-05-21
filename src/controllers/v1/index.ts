import { Router } from 'express';

import { Route } from '../../constants';
import { payoutRouter } from './payout';
import { nftRouter } from './nft-validation';
import { healthCheckRouter } from './health-check';
import { tokenAccountRouter } from './create-token-account';
import { stakingRouter } from './staking';
import { authRouter } from './auth';
import { accountRouter } from './account';
import { forgeBotRouter } from './forgebot';
import { forgeBotsRouter } from './forgebots';
import { companionsRouter } from './companions';
import { portfolioRouter } from './portfolio';

const v1Router = Router();

v1Router.use(Route.Transactions, payoutRouter);
v1Router.use(Route.Nft, nftRouter);
v1Router.use(Route.HealthCheck, healthCheckRouter);
v1Router.use(Route.Account, accountRouter);
v1Router.use(Route.TokenAccount, tokenAccountRouter);
v1Router.use(Route.Staking, stakingRouter);
v1Router.use(Route.Authentication, authRouter);
v1Router.use(Route.ForgeBot, forgeBotRouter);
v1Router.use(Route.ForgeBots, forgeBotsRouter);
v1Router.use(Route.Companions, companionsRouter);
v1Router.use(Route.Portfolio, portfolioRouter);

export { v1Router };
