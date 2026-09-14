import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Droplets,
  User,
  Home,
  FileText,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Sparkles,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { applicationApi, digilockerApi } from '../api/client.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { DigiLockerConsentInitiateResponse } from '../types/index.js';

const waterFormSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email(),
  mobile: z.string().min(10, 'Valid 10-digit mobile required'),
  aadhaarToken: z.string().default('XXXX-XXXX-4819'),
  propertyId: z.string().min(3, 'Property Assessment / Survey Number is required'),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL', 'INDUSTRIAL']).default('RESIDENTIAL'),
  doorNumber: z.string().min(1, 'Door Number is required'),
  streetName: z.string().min(2, 'Street Name is required'),
  wardNumber: z.string().min(1, 'Ward Number is required'),
  zone: z.string().default('East Zone'),
  city: z.string().default('Coimbatore'),
  pincode: z.string().min(6, 'Valid 6-digit Pincode required'),
  connectionType: z.enum(['DOMESTIC', 'COMMERCIAL', 'INDUSTRIAL']).default('DOMESTIC'),
  estimatedDailyLiters: z.number().default(500),
  consentGranted: z.boolean().refine((v) => v === true, 'You must grant cross-department data sharing consent'),
  mockDocumentUploaded: z.boolean().default(true),
  documentFileName: z.string().default('Property_Tax_Receipt_2025_2026.pdf'),
});

type WaterFormData = z.infer<typeof waterFormSchema>;

export const WaterApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // DigiLocker Consent & Autofill States
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isDigiLockerLoading, setIsDigiLockerLoading] = useState(false);
  const [consentDetails, setConsentDetails] = useState<DigiLockerConsentInitiateResponse | null>(null);
  const [isAutofilledFromDigiLocker, setIsAutofilledFromDigiLocker] = useState(false);
  const [digiLockerStatus, setDigiLockerStatus] = useState<any>(null);
  const [digiLockerError, setDigiLockerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<WaterFormData>({
    resolver: zodResolver(waterFormSchema),
    defaultValues: {
      fullName: user?.fullName || 'Kavitha Sundaram',
      email: user?.email || 'citizen@govconnect.demo',
      mobile: user?.profile?.mobile || '9876543210',
      aadhaarToken: 'XXXX-XXXX-4819',
      propertyId: 'TN-COI-2026-88192',
      propertyType: 'RESIDENTIAL',
      doorNumber: '18/B',
      streetName: 'Avinashi Road, Anna Nagar Extension',
      wardNumber: 'Ward 22',
      zone: 'East Zone',
      city: 'Coimbatore',
      pincode: '641004',
      connectionType: 'DOMESTIC',
      estimatedDailyLiters: 500,
      consentGranted: true,
      mockDocumentUploaded: true,
      documentFileName: 'Property_Tax_Receipt_2025_2026.pdf',
    },
  });

  const formValues = watch();

  useEffect(() => {
    digilockerApi.getStatus().then((res) => {
      if (res.success) setDigiLockerStatus(res.data);
    }).catch((err) => console.error('Failed to get DigiLocker status', err));
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('digilocker_session');
    const errorParam = searchParams.get('digilocker_error');

    if (errorParam) {
      setDigiLockerError(`DigiLocker authorization: ${errorParam}. You can continue entering details manually.`);
    } else if (sessionId) {
      setIsDigiLockerLoading(true);
      digilockerApi.getSessionData(sessionId)
        .then((res) => {
          if (res.success && res.data.standardizedData) {
            applyDigiLockerData(res.data.standardizedData);
          }
        })
        .catch((err) => {
          console.error('Session retrieval error', err);
          setDigiLockerError('Failed to load session data. You may proceed manually.');
        })
        .finally(() => setIsDigiLockerLoading(false));
    }
  }, [searchParams]);

  const handleOpenDigiLockerConsent = async () => {
    setIsDigiLockerLoading(true);
    setDigiLockerError(null);
    try {
      const res = await digilockerApi.initiateConsent('WTR-001', '/apply/water');
      if (res.success && res.data) {
        setConsentDetails(res.data);
        setIsConsentModalOpen(true);
      }
    } catch (err: any) {
      console.error('DigiLocker initiate error', err);
      setDigiLockerError(err.response?.data?.error?.message || 'DigiLocker service unavailable. You can enter details manually.');
    } finally {
      setIsDigiLockerLoading(false);
    }
  };

  const handleConfirmConsent = async () => {
    if (!consentDetails) return;
    setIsDigiLockerLoading(true);
    setDigiLockerError(null);

    try {
      if (consentDetails.integrationMode === 'REAL_AUTHORIZED' && consentDetails.authorizationUrl) {
        window.location.href = consentDetails.authorizationUrl;
        return;
      }

      const res = await digilockerApi.completeRepresentative(consentDetails.sessionId);
      if (res.success && res.data.standardizedData) {
        applyDigiLockerData(res.data.standardizedData);
        setIsConsentModalOpen(false);
      }
    } catch (err: any) {
      console.error('Consent completion error', err);
      setDigiLockerError(err.response?.data?.error?.message || 'DigiLocker retrieval failed. You can proceed manually.');
      setIsConsentModalOpen(false);
    } finally {
      setIsDigiLockerLoading(false);
    }
  };

  const handleDenyConsent = async () => {
    if (consentDetails) {
      try {
        await digilockerApi.denyConsent(consentDetails.sessionId);
      } catch (err) {
        console.error('Deny consent error', err);
      }
    }
    setIsConsentModalOpen(false);
  };

  const applyDigiLockerData = (data: any) => {
    if (data.fullName) setValue('fullName', data.fullName);
    if (data.mobile) setValue('mobile', data.mobile);
    if (data.email) setValue('email', data.email);

    if (data.address) {
      if (data.address.doorNumber) setValue('doorNumber', data.address.doorNumber);
      if (data.address.streetName) setValue('streetName', data.address.streetName);
      if (data.address.wardNumber) setValue('wardNumber', data.address.wardNumber);
      if (data.address.zone) setValue('zone', data.address.zone as any);
      if (data.address.city) setValue('city', data.address.city);
      if (data.address.pincode) setValue('pincode', data.address.pincode);
    }

    if (data.documents && data.documents.length > 0) {
      setValue('mockDocumentUploaded', true);
      setValue('documentFileName', data.documents[0].fileName || 'DigiLocker_Verified_Property_Tax_2025_2026.pdf');
    }

    setIsAutofilledFromDigiLocker(true);
  };

  const handleNextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['fullName', 'email', 'mobile']);
    } else if (step === 2) {
      isValid = await trigger(['propertyId', 'doorNumber', 'streetName', 'wardNumber', 'pincode']);
    } else if (step === 3) {
      isValid = await trigger(['mockDocumentUploaded']);
    } else if (step === 4) {
      isValid = await trigger(['consentGranted']);
    } else {
      isValid = true;
    }

    if (isValid) {
      setStep((prev) => Math.min(6, prev + 1));
    }
  };

  const onSubmit = async (data: WaterFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionProgress('1. Initiating application and creating audit record...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('2. Querying UIDAI Aadhaar mock connector for identity verification...');

      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('3. Calling Revenue Department mock connector via granted consent...');

      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('4. Standardizing legacy Revenue schema into GovConnect canonical model...');

      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('5. Verifying DigiLocker PKI digital signatures & municipal water feasibility...');

      const res = await applicationApi.createWaterApplication(data);

      if (res.success && res.data) {
        setSubmissionProgress('✓ Application successfully submitted with Unified ID!');
        await new Promise((r) => setTimeout(r, 800));
        navigate(`/applications/${res.data.id}`);
      }
    } catch (err: any) {
      setSubmissionError(err.response?.data?.error?.message || 'Application submission failed.');
      setIsSubmitting(false);
      setSubmissionProgress(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
              <Droplets className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#123B6D]">
              Unified Interoperable Service Workflow
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
            New Domestic Water Connection Application
          </h1>
          <p className="text-xs text-[#5B667A] mt-1">
            Department of Municipal Administration & Water Supply in coordination with Revenue & Land Administration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary">Unified Multi-Dept Pipeline</Badge>
          {digiLockerStatus && (
            <Badge variant={digiLockerStatus.mode === 'REAL_AUTHORIZED' ? 'success' : 'neutral'} size="sm">
              DigiLocker: {digiLockerStatus.mode === 'REAL_AUTHORIZED' ? 'Live Connected' : 'Representative'}
            </Badge>
          )}
        </div>
      </div>

      {/* DigiLocker Error Alert */}
      {digiLockerError && (
        <div className="p-4 bg-[#FFF8E6] border border-[#FFE082] text-[#B37400] rounded-xl text-xs font-medium flex items-center justify-between shadow-gov-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D99000] shrink-0" />
            <span>{digiLockerError}</span>
          </div>
          <button type="button" onClick={() => setDigiLockerError(null)} className="text-[#5B667A] hover:text-[#172033] font-bold ml-3 cursor-pointer">✕</button>
        </div>
      )}

      {/* DigiLocker Fast-Track Card */}
      {!isAutofilledFromDigiLocker ? (
        <div className="bg-white p-5 rounded-2xl border border-[#DDE3EA] shadow-gov flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#123B6D]" />
              <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">Save Time with DigiLocker</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
                Representative Integration
              </span>
            </div>
            <p className="text-xs text-[#5B667A] leading-relaxed">
              Retrieve permitted demographic information and verified property tax documents securely after giving consent.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isDigiLockerLoading}
              onClick={handleOpenDigiLockerConsent}
              leftIcon={<FileCheck2 className="w-4 h-4" />}
            >
              Fill using DigiLocker
            </Button>
            <span className="text-xs text-[#5B667A] font-medium">or enter manually below</span>
          </div>
        </div>
      ) : (
        <div className="bg-[#E8F5E9] border border-[#A3E9B9] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-gov-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#A3E9B9] text-[#198754] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-[#172033]">
                <span>✓ Retrieved from DigiLocker</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#198754] border border-[#A3E9B9]">
                  Verified Data
                </span>
              </div>
              <p className="text-[#5B667A] text-[11px]">
                Applicant details and tax receipts imported securely. Review your information before final submission.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Review / Edit Fields
            </Button>
          </div>
        </div>
      )}

      {/* 6-Step Visual Progress Stepper */}
      <div className="bg-white p-4 rounded-xl border border-[#DDE3EA] shadow-gov">
        <div className="grid grid-cols-6 gap-2 text-center text-[11px] font-semibold">
          {[
            { n: 1, title: 'Personal', icon: <User className="w-3.5 h-3.5" /> },
            { n: 2, title: 'Property', icon: <Home className="w-3.5 h-3.5" /> },
            { n: 3, title: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
            { n: 4, title: 'Consent', icon: <Lock className="w-3.5 h-3.5" /> },
            { n: 5, title: 'Review', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { n: 6, title: 'Submit', icon: <Droplets className="w-3.5 h-3.5" /> },
          ].map((s) => (
            <div
              key={s.n}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                step === s.n
                  ? 'bg-[#123B6D] text-white shadow-sm'
                  : step > s.n
                  ? 'bg-[#E8F5E9] text-[#198754] border border-[#A3E9B9]'
                  : 'bg-[#F5F7FA] text-[#5B667A]'
              }`}
            >
              <div className="flex items-center gap-1">
                {step > s.n ? <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" /> : s.icon}
                <span className="hidden sm:inline font-bold">Step {s.n}</span>
              </div>
              <span className="text-[10px] truncate max-w-full">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Body */}
      <Card className="shadow-gov-md border-[#DDE3EA]">
        {submissionError && (
          <div className="mb-6 p-4 bg-[#FDEDEC] border border-[#F5B7B1] text-[#C0392B] rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <User className="w-4 h-4 text-[#123B6D]" />
                  <span>Step 1: Applicant Demographics & Identity</span>
                </div>
                {isAutofilledFromDigiLocker && (
                  <span className="text-[10px] font-bold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Retrieved from DigiLocker
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-xs text-[#172033] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#198754] shrink-0" />
                <span>Identity authenticated via tokenized UIDAI Aadhaar e-KYC reference: <b>XXXX-XXXX-4819</b></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Applicant Full Name <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.fullName && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Mobile Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('mobile')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.mobile && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.mobile.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Email Address <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Masked Aadhaar Token</label>
                  <input
                    type="text"
                    disabled
                    value={formValues.aadhaarToken}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#DDE3EA] bg-[#F5F7FA] rounded-lg text-[#5B667A] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Service & Property Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <Home className="w-4 h-4 text-[#123B6D]" />
                  <span>Step 2: Property & Municipal Water Service Details</span>
                </div>
                {isAutofilledFromDigiLocker && (
                  <span className="text-[10px] font-bold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Address from DigiLocker
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Property Assessment / Survey Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('propertyId')}
                    placeholder="e.g. TN-COI-2026-88192"
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none font-mono shadow-gov-sm"
                  />
                  {errors.propertyId && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.propertyId.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Property Classification</label>
                  <select
                    {...register('propertyType')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] border border-[#DDE3EA] rounded-lg bg-white focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  >
                    <option value="RESIDENTIAL">Residential Property</option>
                    <option value="COMMERCIAL">Commercial Establishment</option>
                    <option value="INDUSTRIAL">Industrial Unit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Door / Plot Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('doorNumber')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Street Name & Area <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('streetName')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Municipal Ward Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('wardNumber')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Postal Pincode <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('pincode')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl text-xs text-[#172033]">
                <span className="font-bold text-[#123B6D] block mb-0.5">Municipal Connection Parameters:</span>
                <p>Standard Domestic Pipe Diameter: <b>0.5 inch (15mm)</b> | Municipal Connection Fee: <b>₹250</b></p>
              </div>
            </div>
          )}

          {/* STEP 3: Document Upload */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <FileText className="w-4 h-4 text-[#123B6D]" />
                  <span>Step 3: Document & DigiLocker Verification</span>
                </div>
                {isAutofilledFromDigiLocker && (
                  <span className="text-[10px] font-bold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PKI Verified from DigiLocker
                  </span>
                )}
              </div>

              <div className="border-2 border-dashed border-[#DDE3EA] rounded-xl p-6 text-center space-y-3 bg-[#F5F7FA]">
                <div className="w-12 h-12 rounded-xl bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[#172033] text-sm">Property Tax Receipt (2025-2026)</h4>
                  <p className="text-xs text-[#5B667A] mt-0.5">
                    {isAutofilledFromDigiLocker
                      ? 'Retrieved & Cryptographically Signed from DigiLocker Gateway'
                      : 'Upload scanned property tax receipt or import via DigiLocker'}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DDE3EA] rounded-lg text-xs font-bold text-[#172033] shadow-gov-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#198754]" />
                  <span>{formValues.documentFileName || 'Property_Tax_Receipt_2025_2026.pdf'} (340 KB)</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-xs text-[#172033] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#198754] shrink-0" />
                <span>
                  DigiLocker Connector status: <b>PKI Signature Verified against Municipal Authority (SHA256withRSA:VALID)</b>
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Digital Consent Gate */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-bold text-[#172033] pb-2 border-b border-[#DDE3EA]">
                <Lock className="w-4 h-4 text-[#198754]" />
                <span>Step 4: Cross-Department Data Access Consent</span>
              </div>

              <div className="p-4 bg-[#FFF8E6] border border-[#FFE082] rounded-xl space-y-3 text-xs text-[#172033]">
                <div className="flex items-center justify-between pb-2 border-b border-[#FFE082]">
                  <span className="font-bold text-[#B37400] text-sm">Data Sharing Authorization Request</span>
                  <Badge variant="warning">Explicit Permission Required</Badge>
                </div>

                <div className="space-y-1.5 leading-relaxed text-[#172033]">
                  <p><b>Requesting Agency:</b> Municipal Administration & Water Supply Department</p>
                  <p><b>Data Provider:</b> Revenue & Land Administration Department</p>
                  <p><b>Purpose:</b> Automated verification of land ownership, Patta validity, and property tax clearance for municipal water connection.</p>
                  <p><b>Data Scope:</b> [property_owner, property_no, tax_clearance_status, patta_chitta_no]</p>
                  <p><b>Validity Period:</b> 90 Days (with unconditional right to revoke at any time)</p>
                </div>

                <div className="pt-3 border-t border-[#FFE082] flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    {...register('consentGranted')}
                    className="mt-0.5 rounded border-[#D99000] text-[#123B6D] focus:ring-[#123B6D]"
                  />
                  <label htmlFor="consentCheck" className="text-xs font-bold text-[#172033] cursor-pointer">
                    I hereby grant explicit consent for GovConnect to query my property and tax clearance records from the Revenue Department on my behalf.
                  </label>
                </div>
                {errors.consentGranted && (
                  <p className="text-[11px] text-[#C0392B] font-bold">{errors.consentGranted.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-bold text-[#172033] pb-2 border-b border-[#DDE3EA]">
                <CheckCircle2 className="w-4 h-4 text-[#198754]" />
                <span>Step 5: Review Application Summary</span>
              </div>

              <div className="bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl p-4 text-xs space-y-3 divide-y divide-[#DDE3EA]">
                <div className="pb-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#172033] block">{formValues.fullName}</span>
                    <span className="text-[#5B667A]">{formValues.mobile} | {formValues.email}</span>
                  </div>
                  <Badge variant="success">UIDAI Authenticated</Badge>
                </div>

                <div className="pt-2 space-y-1">
                  <p className="font-bold text-[#172033]">Property & Location:</p>
                  <p className="text-[#5B667A]">
                    {formValues.doorNumber}, {formValues.streetName}, {formValues.wardNumber}, {formValues.city} - {formValues.pincode}
                  </p>
                  <p className="text-[#5B667A] font-mono">Assessment ID: {formValues.propertyId}</p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#172033]">Connection Type & Fee:</span>
                    <p className="text-[#5B667A]">{formValues.connectionType} Connection (0.5" pipe)</p>
                  </div>
                  <span className="font-extrabold text-base text-[#172033]">₹250.00</span>
                </div>

                <div className="pt-2 text-[#198754] font-bold">
                  ✓ Revenue Department Land Records Verification Consent: GRANTED
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Submission Progress Stream */}
          {step === 6 && (
            <div className="space-y-6 text-center py-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE] flex items-center justify-center mx-auto shadow-gov-sm">
                <Droplets className="w-8 h-8 text-[#123B6D]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#172033]">
                  {isSubmitting ? 'Executing Interoperability Pipeline...' : 'Ready to Dispatch'}
                </h3>
                <p className="text-xs text-[#5B667A] max-w-md mx-auto">
                  GovConnect will coordinate with Aadhaar, Revenue Department, DigiLocker, and Water Board in real-time.
                </p>
              </div>

              {submissionProgress && (
                <div className="p-4 bg-[#0B2A4A] text-[#A3E9B9] rounded-xl font-mono text-xs text-left max-w-lg mx-auto shadow-gov-md space-y-1 border border-[#123B6D]">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700 text-slate-300 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F4A340]" />
                    <span>INTEROPERABILITY ENGINE LOG:</span>
                  </div>
                  <p className="text-[#F4A340]">{submissionProgress}</p>
                </div>
              )}

              {!isSubmitting && (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full max-w-md mx-auto"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Confirm & Submit to Water Department
                </Button>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          {step < 6 && (
            <div className="pt-6 border-t border-[#DDE3EA] flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={step === 1}
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>

              <span className="text-xs font-semibold text-[#5B667A]">Step {step} of 6</span>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {step === 5 ? 'Proceed to Live Dispatch' : 'Next Step'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* DigiLocker Consent Modal */}
      <Modal
        isOpen={isConsentModalOpen}
        onClose={handleDenyConsent}
        title="DigiLocker Consent & Auto-Fill Authorization"
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Integration Mode Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F7FA] border border-[#DDE3EA]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#123B6D] animate-pulse" />
              <span className="text-xs font-bold text-[#172033]">Integration Status</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
              DigiLocker Integration: {consentDetails?.integrationMode === 'REAL_AUTHORIZED' ? 'Real Authorized' : 'Representative'}
            </span>
          </div>

          {/* Core Explanation */}
          <div className="text-xs text-[#5B667A] leading-relaxed">
            <p>
              GovConnect requests your explicit permission to retrieve your verified demographic and property tax records from <b>DigiLocker</b> to pre-populate your <b>New Domestic Water Connection Application (WTR-001)</b>.
            </p>
          </div>

          {/* Requested Information Checklist */}
          <div className="bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#123B6D] uppercase tracking-wide flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#123B6D]" />
              Information Requested from DigiLocker
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-[#172033]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#198754] shrink-0" />
                <span><b>Identity Details:</b> Full Name, Email, and Registered Mobile Number</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#198754] shrink-0" />
                <span><b>Standardized Address:</b> Door No, Street, Ward, Zone, City, Pincode</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#198754] shrink-0" />
                <span><b>Verified Document:</b> Property Tax Assessment Receipt (2025-2026)</span>
              </div>
            </div>
          </div>

          {/* Purpose & Security Guarantees */}
          <div className="p-3.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl space-y-2 text-[11px] text-[#5B667A]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#123B6D] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#172033]">Purpose of Data Access: </span>
                <span>Pre-filling application form and verifying residential jurisdiction. Data is used exclusively for this application session.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#D99000] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#172033]">Zero Credential Architecture: </span>
                <span>GovConnect never collects, accesses, or stores your DigiLocker PIN, password, or security credentials.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#DDE3EA] flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleDenyConsent}
              disabled={isDigiLockerLoading}
              className="w-full sm:w-auto"
            >
              Cancel / Enter Manually
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isDigiLockerLoading}
              onClick={handleConfirmConsent}
              rightIcon={consentDetails?.integrationMode === 'REAL_AUTHORIZED' ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {consentDetails?.integrationMode === 'REAL_AUTHORIZED'
                ? 'Continue to DigiLocker Authorization'
                : 'Confirm Consent & Fill Form'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
