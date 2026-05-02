import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

export const getCandidatesForPositionController = async (req: Request, res: Response) => {
  try {
    const positionId = parseInt(req.params.id);

    if (isNaN(positionId) || positionId <= 0) {
      return res.status(400).json({ error: 'Invalid position ID' });
    }

    const candidates = await getCandidatesForPosition(positionId);
    res.json(candidates);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Position not found') {
        return res.status(404).json({ error: 'Position not found' });
      }
      if (error.message === 'Invalid position ID') {
        return res.status(400).json({ error: 'Invalid position ID' });
      }
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
