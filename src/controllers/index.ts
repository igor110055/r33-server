import { Router } from 'express';

import { Route } from '../constants';
import { v1Router } from './v1';

const apiRouter = Router();

apiRouter.use(Route.V1, v1Router);

export { apiRouter };
