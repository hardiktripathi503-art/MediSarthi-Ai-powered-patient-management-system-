import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/documentService.js';
import { MedicalDocumentModel } from '../models/MedicalDocument.js';
import { MedicalTimelineModel } from '../models/MedicalTimeline.js';
import { DocumentType } from '../../../shared/types/index.js';

// Memory storage for multer so we can process buffer with Tesseract OCR or direct text extraction
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, PDF, and TXT files are supported'));
    }
  },
});

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message || 'File upload error' });
      return;
    }
    next();
  });
};

export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { patientId, documentType } = req.body;
    if (!patientId) {
      res.status(400).json({ success: false, error: 'patientId is required' });
      return;
    }

    const file = req.file;
    const fileName = file?.originalname || 'Prescription_Sample.png';
    const fileType = file?.mimetype || 'image/png';
    const docType: DocumentType = documentType || 'PRESCRIPTION';

    const savedDoc = await documentService.processAndSaveDocument(
      patientId,
      fileName,
      fileType,
      docType,
      file?.buffer
    );

    res.status(201).json({ success: true, data: savedDoc.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentsByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = await MedicalDocumentModel.find({ patientId: req.params.patientId }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await MedicalDocumentModel.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }
    res.json({ success: true, data: doc.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function verifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { verificationStatus, doctorNotes } = req.body;
    const doc = await MedicalDocumentModel.findByIdAndUpdate(
      req.params.id,
      { verificationStatus, doctorNotes },
      { new: true }
    );

    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    await MedicalTimelineModel.updateMany(
      { sourceId: doc.id },
      { verifiedStatus: verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING' }
    );

    res.json({ success: true, data: doc.toJSON() });
  } catch (err) {
    next(err);
  }
}
