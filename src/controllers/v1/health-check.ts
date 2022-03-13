import { Router, Request, Response } from 'express';

const handleHealthCheck = async (request: Request, response: Response) => {
  return response.json({
    code: 200,
  });
};

// Route assignments
const healthCheckRouter = Router();
healthCheckRouter.get(`/status`, handleHealthCheck);

export { healthCheckRouter };
