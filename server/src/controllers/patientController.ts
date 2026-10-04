import { Request, Response, NextFunction } from 'express';
import { PatientProfileModel } from '../models/PatientProfile.js';
import { ConsultationModel } from '../models/Consultation.js';
import { MedicalDocumentModel } from '../models/MedicalDocument.js';
import { MedicalTimelineModel } from '../models/MedicalTimeline.js';

export async function listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string;
    const query: any = {};
    if (search && search.trim() !== '') {
      query.name = { $regex: search, $options: 'i' };
    }

    const patients = await PatientProfileModel.find(query).sort({ updatedAt: -1 }).limit(50);
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
}

export async function getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patient = await PatientProfileModel.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    const consultations = await ConsultationModel.find({ patientId: patient._id }).sort({ createdAt: -1 });
    const documents = await MedicalDocumentModel.find({ patientId: patient._id }).sort({ uploadedAt: -1 });
    const timeline = await MedicalTimelineModel.find({ patientId: patient._id }).sort({ date: -1 });

    res.json({
      success: true,
      data: {
        patient,
        consultations,
        documents,
        timeline,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, age, gender, contact, allergies, chronicConditions, medications, status, doctorReview } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = Number(age);
    if (gender !== undefined) updateData.gender = gender;
    if (contact !== undefined) updateData.contact = contact;
    if (allergies !== undefined) updateData.allergies = Array.isArray(allergies) ? allergies : [allergies];
    if (chronicConditions !== undefined) updateData.chronicConditions = Array.isArray(chronicConditions) ? chronicConditions : [chronicConditions];
    if (medications !== undefined) updateData.medications = Array.isArray(medications) ? medications : [medications];
    if (status !== undefined) updateData.status = status;
    if (doctorReview !== undefined) updateData.doctorReview = doctorReview;

    const updated = await PatientProfileModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    // Keep patientName, patientAge, patientGender synchronized in consultations
    if (name || age || gender) {
      const consUpdate: any = {};
      if (name) consUpdate.patientName = name;
      if (age) consUpdate.patientAge = Number(age);
      if (gender) consUpdate.patientGender = gender;
      await ConsultationModel.updateMany({ patientId: updated._id }, { $set: consUpdate });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function reviewPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, status, notes, rejectionReason, acceptanceNotes, department, reviewedBy } = req.body;
    const patientId = req.params.id;

    const patient = await PatientProfileModel.findById(patientId);
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    const doctorName =
      reviewedBy ||
      (req as any).user?.name ||
      'Dr. V. K. Saxena, MD';

    const effectiveAction = action || status;
    const newStatus =
      effectiveAction === 'ACCEPT' || effectiveAction === 'ACCEPTED'
        ? 'ACCEPTED'
        : effectiveAction === 'REJECT' || effectiveAction === 'REJECTED'
        ? 'REJECTED'
        : 'PENDING';

    patient.status = newStatus;
    patient.doctorReview = {
      status: newStatus,
      reviewedBy: doctorName,
      reviewedAt: new Date(),
      acceptanceNotes: acceptanceNotes || (newStatus === 'ACCEPTED' ? notes : undefined),
      rejectionReason: rejectionReason || (newStatus === 'REJECTED' ? notes : undefined),
      department: department || (newStatus === 'ACCEPTED' ? 'General OPD' : undefined),
    };

    await patient.save();

    // Create a timeline entry for clinical record tracking
    try {
      const eventTitle =
        newStatus === 'ACCEPTED'
          ? `Patient Accepted & Admitted to ${patient.doctorReview.department || 'OPD'}`
          : newStatus === 'REJECTED'
          ? `Patient Intake Rejected / Escalated`
          : `Patient Review Reset to Pending`;

      const eventDesc =
        newStatus === 'ACCEPTED'
          ? `Accepted by ${doctorName}.${patient.doctorReview.acceptanceNotes ? ' Notes: ' + patient.doctorReview.acceptanceNotes : ''}`
          : newStatus === 'REJECTED'
          ? `Intake rejected by ${doctorName}.${patient.doctorReview.rejectionReason ? ' Reason: ' + patient.doctorReview.rejectionReason : ''}`
          : `Intake status reset to pending review by ${doctorName}.`;

      await MedicalTimelineModel.create({
        patientId: patient._id,
        date: new Date().toISOString(),
        eventType: 'CONSULTATION',
        title: eventTitle,
        summary: eventDesc,
        sourceId: patient._id.toString(),
        verifiedStatus: newStatus === 'ACCEPTED' ? 'VERIFIED' : 'PENDING',
      });
    } catch (timelineErr) {
      console.warn('[PatientReview] Failed to log timeline event:', timelineErr);
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, age, gender, contact, allergies, chronicConditions, medications } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Patient name is required' });
      return;
    }

    const patient = await PatientProfileModel.create({
      name,
      age: Number(age) || 30,
      gender: gender || 'OTHER',
      contact: contact || '',
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      medications: medications || [],
    });

    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}
