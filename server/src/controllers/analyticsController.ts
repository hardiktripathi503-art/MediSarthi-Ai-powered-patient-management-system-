import { Request, Response, NextFunction } from 'express';
import { ConsultationModel } from '../models/Consultation.js';
import { PatientProfileModel } from '../models/PatientProfile.js';
import { MedicalDocumentModel } from '../models/MedicalDocument.js';

export async function getDashboardAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalPatients = await PatientProfileModel.countDocuments();
    const totalConsultations = await ConsultationModel.countDocuments();
    const totalDocuments = await MedicalDocumentModel.countDocuments();

    // High Priority Alerts
    const highPriorityCount = await ConsultationModel.countDocuments({
      'triageResult.riskLevel': 'HIGH',
    });

    const mediumPriorityCount = await ConsultationModel.countDocuments({
      'triageResult.riskLevel': 'MEDIUM',
    });

    const lowPriorityCount = await ConsultationModel.countDocuments({
      'triageResult.riskLevel': 'LOW',
    });

    // Pending Reviews
    const pendingReviewsCount = await ConsultationModel.countDocuments({
      'doctorReview.status': 'AI_GENERATED',
    });

    const reviewedCount = await ConsultationModel.countDocuments({
      'doctorReview.status': { $in: ['DOCTOR_REVIEWED', 'DOCTOR_EDITED'] },
    });

    // Language Breakdown
    const hindiCount = await ConsultationModel.countDocuments({ language: 'hi' });
    const englishCount = await ConsultationModel.countDocuments({ language: 'en' });

    // Intake Mode Breakdown
    const ayushCount = await ConsultationModel.countDocuments({ mode: 'AYUSH' });
    const modernCount = await ConsultationModel.countDocuments({ mode: 'MODERN' });

    // Recent critical alerts
    const criticalAlerts = await ConsultationModel.find({
      'triageResult.riskLevel': 'HIGH',
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summaryCards: {
          totalPatients,
          totalConsultations,
          highPriorityAlerts: highPriorityCount,
          pendingReviews: pendingReviewsCount,
          reviewedCases: reviewedCount,
          totalDocuments,
        },
        triageDistribution: [
          { name: 'High Risk (Urgent)', value: highPriorityCount, color: '#ef4444' },
          { name: 'Medium Risk', value: mediumPriorityCount, color: '#f59e0b' },
          { name: 'Low Risk', value: lowPriorityCount, color: '#10b981' },
        ],
        languageBreakdown: [
          { name: 'Hindi', count: hindiCount },
          { name: 'English', count: englishCount },
        ],
        modeBreakdown: [
          { name: 'Modern Intake', count: modernCount },
          { name: 'AYUSH Intake', count: ayushCount },
        ],
        criticalAlerts,
      },
    });
  } catch (err) {
    next(err);
  }
}
