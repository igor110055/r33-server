import { Router, Request, Response } from 'express';
import {
  getForgeBotWithCompanionByName,
  getForgeBotWithCompanionById,
} from '../../repository/forgebots';

const handleGetForgeBot = async (request: Request, response: Response) => {
  try {
    const { id, name } = request.query;
    let forgeBot;

    if (id) {
      forgeBot = await getForgeBotWithCompanionById(id);
    }

    if (name) {
      forgeBot = await getForgeBotWithCompanionByName(name);
    }

    // NOT FOUND CASE
    if (!forgeBot) {
      return response.status(404).json({
        code: 404,
        message: 'ForgeBot not fount!',
      });
    }

    return response.json({
      code: 200,
      message: 'ForgeBot Found!',
      data: forgeBot,
    });
  } catch (error) {
    console.log('Error getting specified ForgeBot', error);
    return response.status(500).json({
      code: 500,
      message: 'Error getting ForgeBot.',
    });
  }
};

// Route assignments
const forgeBotRouter = Router();
forgeBotRouter.get(``, handleGetForgeBot);

export { forgeBotRouter };
