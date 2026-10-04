import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
  Activity,
  Pill,
} from 'lucide-react';
import { api } from '../../services/api';
import { MedicalDocument, DocumentType } from '@shared/types';
import { useLanguage } from '../../i18n/LanguageContext';

interface DocumentUploadModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (doc: MedicalDocument) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  patientId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('PRESCRIPTION');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<MedicalDocument | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMsg('File size exceeds 10MB limit.');
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const response = await api.uploadDocument(patientId, file, docType);
      if (response.success && response.data) {
        setExtractedResult(response.data);
        onUploadSuccess(response.data);
      } else {
        setErrorMsg((response as any).error || 'Document processing failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-ayush-600">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('documents.title')}</h3>
              <p className="text-xs text-slate-400">OCR & Clinical Entity Parser</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!extractedResult ? (
            <>
              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Document Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'PRESCRIPTION', label: 'Prescription' },
                    { id: 'BLOOD_REPORT', label: 'Blood Report' },
                    { id: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' },
                    { id: 'OTHER', label: 'Other Report' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDocType(item.id as DocumentType)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                        docType === item.id
                          ? 'bg-ayush-50 border-ayush-600 text-ayush-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-ayush-500 bg-ayush-50/50'
                    : 'border-slate-300 hover:border-ayush-500 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-ayush-100 flex items-center justify-center text-ayush-700">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {file ? file.name : t('documents.dragDrop')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {file
                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace`
                        : t('documents.supportedFormats')}
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          ) : (
            /* Extraction Results Review */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>OCR analysis complete. Clinical entities extracted and added to timeline.</span>
              </div>

              {/* Flagged Abnormalities */}
              {extractedResult.structuredData.potentialAbnormalities?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {t('documents.potentialAbnormal')}:
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-amber-900">
                    {extractedResult.structuredData.potentialAbnormalities.map((abn, idx) => (
                      <li key={idx} className="font-medium">
                        {abn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Lab Investigations */}
              {extractedResult.structuredData.investigations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('documents.extractedValues')}
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 font-semibold text-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Test Name</th>
                          <th className="px-3 py-2 text-left">Extracted Value</th>
                          <th className="px-3 py-2 text-left">Reference Range</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {extractedResult.structuredData.investigations.map((inv, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-slate-900">{inv.testName}</td>
                            <td className="px-3 py-2 font-bold text-slate-800">{inv.value}</td>
                            <td className="px-3 py-2 text-slate-500">{inv.referenceRange || 'N/A'}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inv.isAbnormal
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {inv.isAbnormal ? 'Abnormal / Elevated' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Extracted Medications */}
              {extractedResult.structuredData.medications?.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Pill className="w-4 h-4 text-purple-600" />
                    <span>Prescribed / Mentioned Medications:</span>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {extractedResult.structuredData.medications.join(', ')}
                  </p>
                </div>
              )}

              {/* Non-Diagnostic Disclaimer */}
              <p className="text-[11px] text-slate-400 italic">
                * OCR data is informational. Doctor must cross-examine and verify before clinical decision-making.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          {!extractedResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-ayush-700 hover:bg-ayush-800 text-white shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('documents.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>{t('documents.uploadButton')}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              Done & View Timeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
