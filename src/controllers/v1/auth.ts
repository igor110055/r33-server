import { Router, Request, Response } from 'express';

const handleLogin = async (request: Request, response: Response) => {
  return response.json({
    code: 200,
    message: 'login stub',
  });
};

// Route assignments
const authRouter = Router();
authRouter.post(`/login`, handleLogin);

export { authRouter };
