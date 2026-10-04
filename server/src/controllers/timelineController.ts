import { Request, Response, NextFunction } from 'express';
import { MedicalTimelineModel } from '../models/MedicalTimeline.js';

export async function getPatientTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const timeline = await MedicalTimelineModel.find({ patientId: req.params.patientId }).sort({ date: -1 });
    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
}
