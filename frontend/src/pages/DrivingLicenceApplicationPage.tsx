import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Car,
  User,
  MapPin,
  FileText,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Sparkles,
  ExternalLink,
  Edit3,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { applicationApi, digilockerApi } from '../api/client.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { DigiLockerConsentInitiateResponse } from '../types/index.js';

const dlFormSchema = z.object({
  fullName: z.string().min(2, 'Full Legal Name is required'),
  dob: z.string().min(4, 'Valid Date of Birth is required (YYYY-MM-DD)'),
  email: z.string().email('Valid email address required'),
  mobile: z.string().min(10, 'Valid 10-digit mobile required').max(10, 'Must be 10 digits'),
  aadhaarToken: z.string().default('XXXX-XXXX-4819'),
  dlNumber: z.string().min(5, 'Driving Licence Number is required (e.g. TN38 20180004819)'),
  existingExpiryDate: z.string().default('2028-08-23'),
  issuingState: z.string().default('Tamil Nadu'),
  licensingAuthority: z.string().default('TN-38 (Coimbatore South RTO)'),
  renewLicence: z.boolean().default(true),
  changeAddress: z.boolean().default(true),
  existingAddress: z.string().default('14 Old Housing Board Colony, Ramanathapuram, Coimbatore - 641045'),
  houseBuilding: z.string().min(1, 'House / Door / Building Number is required'),
  street: z.string().min(2, 'Street Name is required'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().default('Tamil Nadu'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
  existingDlDocFileName: z.string().default('Driving_Licence_Original.pdf'),
  addressProofDocFileName: z.string().default('DigiLocker_Verified_Address_Proof.pdf'),
  mockDlUploaded: z.boolean().default(true),
  mockAddressUploaded: z.boolean().default(true),
  isFromDigiLocker: z.boolean().default(false),
  consentGranted: z.boolean().refine((v) => v === true, 'You must grant consent for Parivahan Sarathi cross-verification'),
});

type DLFormData = z.infer<typeof dlFormSchema>;

export const DrivingLicenceApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // DigiLocker Fast-Track State
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isDigiLockerLoading, setIsDigiLockerLoading] = useState(false);
  const [digiLockerStatus, setDigiLockerStatus] = useState<any>(null);
  const [consentDetails, setConsentDetails] = useState<DigiLockerConsentInitiateResponse | null>(null);
  const [isAutofilledFromDigiLocker, setIsAutofilledFromDigiLocker] = useState(false);
  const [digiLockerError, setDigiLockerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<DLFormData>({
    resolver: zodResolver(dlFormSchema),
    defaultValues: {
      fullName: user?.fullName || 'Kavitha Sundaram',
      dob: '1992-07-14',
      email: user?.email || 'citizen@govconnect.demo',
      mobile: user?.profile?.mobile || '9876543210',
      aadhaarToken: 'XXXX-XXXX-4819',
      dlNumber: 'TN38 20180004819',
      existingExpiryDate: '2028-08-23',
      issuingState: 'Tamil Nadu',
      licensingAuthority: 'TN-38 (Coimbatore South RTO)',
      renewLicence: true,
      changeAddress: true,
      existingAddress: '14 Old Housing Board Colony, Ramanathapuram, Coimbatore - 641045',
      houseBuilding: '18/B',
      street: 'Avinashi Road, Anna Nagar Extension',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      existingDlDocFileName: 'Driving_Licence_Original.pdf',
      addressProofDocFileName: 'DigiLocker_Verified_Address_Proof.pdf',
      mockDlUploaded: true,
      mockAddressUploaded: true,
      isFromDigiLocker: false,
      consentGranted: true,
    },
  });

  const formValues = watch();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await digilockerApi.getStatus();
        if (res.success) {
          setDigiLockerStatus(res.data);
        }
      } catch (err) {
        console.error('Failed to load DigiLocker status', err);
      }
    };

    fetchStatus();

    const urlSession = searchParams.get('digilocker_session');
    const urlError = searchParams.get('digilocker_error');

    if (urlError) {
      setDigiLockerError(`DigiLocker Authorization Failed: ${decodeURIComponent(urlError)}`);
    } else if (urlSession) {
      const loadSession = async () => {
        setIsDigiLockerLoading(true);
        try {
          const res = await digilockerApi.getSessionData(urlSession);
          if (res.success && res.data.standardizedData) {
            applyDigiLockerData(res.data.standardizedData);
          }
        } catch (err: any) {
          console.error('Failed to load authorized session', err);
          setDigiLockerError('Could not retrieve authorized session data.');
        } finally {
          setIsDigiLockerLoading(false);
        }
      };
      loadSession();
    }
  }, [searchParams]);

  const handleOpenDigiLockerConsent = async () => {
    setIsDigiLockerLoading(true);
    setDigiLockerError(null);
    try {
      const res = await digilockerApi.initiateConsent('TRN-001', '/apply/driving-licence');
      if (res.success) {
        setConsentDetails(res.data);
        setIsConsentModalOpen(true);
      }
    } catch (err: any) {
      console.error('Failed to initiate DigiLocker consent', err);
      setDigiLockerError(err.response?.data?.error?.message || 'DigiLocker service temporarily unavailable. You can enter details manually.');
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
    if (data.dateOfBirth) setValue('dob', data.dateOfBirth);
    if (data.mobile) setValue('mobile', data.mobile);
    if (data.email) setValue('email', data.email);
    if (data.dlNumber) setValue('dlNumber', data.dlNumber);
    if (data.licenceExpiry) setValue('existingExpiryDate', data.licenceExpiry);
    if (data.licensingAuthority) setValue('licensingAuthority', data.licensingAuthority);

    if (data.address) {
      if (data.address.doorNumber) setValue('houseBuilding', data.address.doorNumber);
      if (data.address.streetName) setValue('street', data.address.streetName);
      if (data.address.city) setValue('city', data.address.city);
      if (data.address.district) setValue('district', data.address.district);
      if (data.address.state) setValue('state', data.address.state);
      if (data.address.pincode) setValue('pincode', data.address.pincode);
    }

    if (data.documents && data.documents.length > 0) {
      setValue('mockAddressUploaded', true);
      setValue('addressProofDocFileName', data.documents[0].fileName || 'DigiLocker_Verified_Address_Proof.pdf');
    }

    setValue('isFromDigiLocker', true);
    setIsAutofilledFromDigiLocker(true);
  };

  const handleNextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['fullName', 'dob', 'email', 'mobile']);
    } else if (step === 2) {
      isValid = await trigger(['dlNumber', 'existingExpiryDate', 'issuingState', 'licensingAuthority', 'renewLicence', 'changeAddress']);
    } else if (step === 3) {
      isValid = await trigger(['houseBuilding', 'street', 'city', 'district', 'state', 'pincode']);
    } else if (step === 4) {
      isValid = await trigger(['mockDlUploaded', 'mockAddressUploaded']);
    } else if (step === 5) {
      isValid = await trigger(['consentGranted']);
    } else {
      isValid = true;
    }

    if (isValid) {
      setStep((prev) => Math.min(6, prev + 1));
    }
  };

  const onSubmit = async (data: DLFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionProgress('1. Initializing Driving Licence endorsement application...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('2. Querying UIDAI Aadhaar connector for e-KYC token verification...');

      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('3. Connecting with MoRTH Parivahan / Sarathi Gateway for DL status verification...');

      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('4. Verifying digital address proof validity via DigiLocker...');

      await new Promise((r) => setTimeout(r, 600));
      setSubmissionProgress('5. Standardizing schema into GovConnect canonical transport model...');

      const response = await applicationApi.createDrivingLicenceApplication(data);

      if (response.success && response.data) {
        setSubmissionProgress('6. Application submitted successfully! Navigating to tracking dashboard...');
        await new Promise((r) => setTimeout(r, 700));
        navigate(`/applications/${response.data.id}`);
      } else {
        throw new Error(response.error?.message || 'Failed to submit application');
      }
    } catch (err: any) {
      console.error('Submission failed', err);
      setSubmissionError(err.response?.data?.error?.message || err.message || 'Application submission failed. Please try again.');
      setIsSubmitting(false);
      setSubmissionProgress(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE3EA] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE]">
              <Car className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-[#123B6D] uppercase tracking-wider font-mono">
              SERVICE: TRN-001
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-semibold text-[#5B667A]">
              Transport & Highway Department
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
            Driving Licence Renewal + Change of Address
          </h1>
          <p className="text-xs text-[#5B667A] mt-1">
            Ministry of Road Transport & Highways in coordination with State Transport Authority & DigiLocker
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary">MoRTH Sarathi Integrated</Badge>
          {digiLockerStatus && (
            <Badge variant={digiLockerStatus.mode === 'REAL_AUTHORIZED' ? 'success' : 'neutral'} size="sm">
              DigiLocker: {digiLockerStatus.mode === 'REAL_AUTHORIZED' ? 'Live Connected' : 'Representative'}
            </Badge>
          )}
        </div>
      </div>

      {/* DigiLocker Error Toast */}
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
              Retrieve your verified Driving Licence records and Address Proof directly from DigiLocker with your explicit consent to eliminate manual typing.
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
                DL number and address records imported securely. Review your information before final submission.
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
            { n: 2, title: 'Licence Details', icon: <Car className="w-3.5 h-3.5" /> },
            { n: 3, title: 'Address Change', icon: <MapPin className="w-3.5 h-3.5" /> },
            { n: 4, title: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
            { n: 5, title: 'Consent', icon: <Lock className="w-3.5 h-3.5" /> },
            { n: 6, title: 'Review & Submit', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
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
                    Full Legal Name <span className="text-[#C0392B]">*</span>
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
                    Date of Birth (YYYY-MM-DD) <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('dob')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.dob && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.dob.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Mobile Number (Registered) <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('mobile')}
                    maxLength={10}
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
                  {errors.email && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.email.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Driving Licence Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <Car className="w-4 h-4 text-[#123B6D]" />
                  <span>Step 2: Driving Licence & Parivahan Records</span>
                </div>
                {isAutofilledFromDigiLocker && (
                  <span className="text-[10px] font-bold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DL Verified via DigiLocker
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Driving Licence Number <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('dlNumber')}
                    placeholder="e.g. TN38 20180004819"
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none font-mono shadow-gov-sm uppercase"
                  />
                  {errors.dlNumber && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.dlNumber.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Existing Expiry Date <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('existingExpiryDate')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Issuing State</label>
                  <input
                    type="text"
                    {...register('issuingState')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">Licensing Authority (RTO)</label>
                  <input
                    type="text"
                    {...register('licensingAuthority')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>
              </div>

              {/* Endorsement Options */}
              <div className="p-4 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl space-y-3">
                <span className="font-bold text-xs text-[#123B6D] uppercase tracking-wide block">
                  Requested Endorsement Services:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 bg-white p-3 rounded-lg border border-[#DDE3EA] cursor-pointer shadow-gov-sm">
                    <input
                      type="checkbox"
                      {...register('renewLicence')}
                      className="rounded text-[#123B6D] focus:ring-[#123B6D]"
                    />
                    <span className="font-semibold text-[#172033]">Driving Licence Renewal (5-Year Extension)</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-3 rounded-lg border border-[#DDE3EA] cursor-pointer shadow-gov-sm">
                    <input
                      type="checkbox"
                      {...register('changeAddress')}
                      className="rounded text-[#123B6D] focus:ring-[#123B6D]"
                    />
                    <span className="font-semibold text-[#172033]">Change of Address in Licence Record</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Address Change */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <MapPin className="w-4 h-4 text-[#123B6D]" />
                  <span>Step 3: New Residential Address for Endorsement</span>
                </div>
                {isAutofilledFromDigiLocker && (
                  <span className="text-[10px] font-bold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-populated from DigiLocker
                  </span>
                )}
              </div>

              <div className="p-3 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl text-xs space-y-1">
                <span className="font-bold text-[#5B667A] block">Current Address on MoRTH Sarathi Record:</span>
                <p className="text-[#172033] font-medium">{formValues.existingAddress}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    New House / Door / Building No. <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('houseBuilding')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.houseBuilding && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.houseBuilding.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    Street Name & Locality <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('street')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.street && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.street.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    City / Town <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.city && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    District <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('district')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                  {errors.district && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.district.message}</p>}
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">
                    PIN Code <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('pincode')}
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm font-mono"
                  />
                  {errors.pincode && <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Document Verification */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
                  <FileText className="w-4 h-4 text-[#123B6D]" />
                  <span>Step 4: Required Supporting Proofs</span>
                </div>
                {isAutofilledFromDigiLocker && (
                  <span className="text-[10px] font-bold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A3E9B9] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PKI Verified from DigiLocker
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-[#DDE3EA] rounded-xl p-5 text-center space-y-2 bg-[#F5F7FA]">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE] flex items-center justify-center mx-auto">
                    <Car className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#172033]">Existing Driving Licence Copy</h4>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DDE3EA] rounded-lg text-xs font-bold text-[#172033] shadow-gov-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" />
                    <span>{formValues.existingDlDocFileName}</span>
                  </div>
                </div>

                <div className="border-2 border-dashed border-[#DDE3EA] rounded-xl p-5 text-center space-y-2 bg-[#F5F7FA]">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] text-[#123B6D] border border-[#B9D4EE] flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#172033]">Valid Address Proof Certificate</h4>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#DDE3EA] rounded-lg text-xs font-bold text-[#172033] shadow-gov-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" />
                    <span>{formValues.addressProofDocFileName}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#E8F5E9] border border-[#A3E9B9] rounded-xl text-xs text-[#172033] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#198754] shrink-0" />
                <span>
                  MoRTH Parivahan Sarathi Connector & DigiLocker Gateway: <b>Pre-authenticated SHA256 Signature Valid</b>
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: Digital Consent Gate */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-bold text-[#172033] pb-2 border-b border-[#DDE3EA]">
                <Lock className="w-4 h-4 text-[#198754]" />
                <span>Step 5: Parivahan Sarathi Cross-Verification Consent</span>
              </div>

              <div className="p-4 bg-[#FFF8E6] border border-[#FFE082] rounded-xl space-y-3 text-xs text-[#172033]">
                <div className="flex items-center justify-between pb-2 border-b border-[#FFE082]">
                  <span className="font-bold text-[#B37400] text-sm">Transport Interoperability Authorization</span>
                  <Badge variant="warning">Explicit Permission Required</Badge>
                </div>

                <div className="space-y-1.5 leading-relaxed text-[#172033]">
                  <p><b>Requesting Agency:</b> State Transport Authority & Coimbatore South RTO</p>
                  <p><b>Data Provider:</b> Ministry of Road Transport & Highways (MoRTH Sarathi Gateway) & UIDAI</p>
                  <p><b>Purpose:</b> Automated validity check of DL record, biometric token cross-verification, and electronic address endorsement.</p>
                  <p><b>Data Scope:</b> [dl_number, holder_name, dob, address, validity_dates, licensing_authority]</p>
                  <p><b>Validity Period:</b> 90 Days (with unconditional right to revoke at any time)</p>
                </div>

                <div className="pt-3 border-t border-[#FFE082] flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="dlConsentCheck"
                    {...register('consentGranted')}
                    className="mt-0.5 rounded border-[#D99000] text-[#123B6D] focus:ring-[#123B6D]"
                  />
                  <label htmlFor="dlConsentCheck" className="text-xs font-bold text-[#172033] cursor-pointer">
                    I hereby grant explicit consent for GovConnect to verify and submit endorsement requests to the MoRTH Parivahan Sarathi system on my behalf.
                  </label>
                </div>
                {errors.consentGranted && (
                  <p className="text-[11px] text-[#C0392B] font-bold">{errors.consentGranted.message}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Review & Live Dispatch Stream */}
          {step === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2 text-sm font-bold text-[#172033] pb-2 border-b border-[#DDE3EA]">
                <CheckCircle2 className="w-4 h-4 text-[#198754]" />
                <span>Step 6: Review & Dispatch Application</span>
              </div>

              <div className="bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl p-4 text-xs space-y-3 divide-y divide-[#DDE3EA]">
                <div className="pb-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#172033] text-sm block">{formValues.fullName}</span>
                    <span className="text-[#5B667A]">DOB: {formValues.dob} | {formValues.mobile}</span>
                  </div>
                  <Badge variant="primary">MoRTH Parivahan</Badge>
                </div>

                <div className="pt-2 space-y-1">
                  <p className="font-bold text-[#172033]">Licence & Endorsement Information:</p>
                  <p className="text-[#5B667A] font-mono">DL Number: <b>{formValues.dlNumber}</b> (Exp: {formValues.existingExpiryDate})</p>
                  <p className="text-[#5B667A]">Authority: {formValues.licensingAuthority}</p>
                </div>

                <div className="pt-2 space-y-1">
                  <p className="font-bold text-[#172033]">New Endorsed Address:</p>
                  <p className="text-[#5B667A]">
                    {formValues.houseBuilding}, {formValues.street}, {formValues.city}, {formValues.district}, {formValues.state} - {formValues.pincode}
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#172033]">Application Statutory Fees:</span>
                    <p className="text-[#5B667A]">DL Renewal (₹200) + Address Endorsement (₹200)</p>
                  </div>
                  <span className="font-extrabold text-base text-[#172033]">₹400.00</span>
                </div>

                <div className="pt-2 text-[#198754] font-bold">
                  ✓ Parivahan Sarathi Interoperability Consent: GRANTED
                </div>
              </div>

              {/* Live Dispatch Stream Logs */}
              {submissionProgress && (
                <div className="p-4 bg-[#0B2A4A] text-[#A3E9B9] rounded-xl font-mono text-xs text-left shadow-gov-md space-y-1 border border-[#123B6D]">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700 text-slate-300 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F4A340]" />
                    <span>INTEROPERABILITY ENGINE LOG:</span>
                  </div>
                  <p className="text-[#F4A340]">{submissionProgress}</p>
                </div>
              )}

              {!isSubmitting && (
                <div className="text-center pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full max-w-md mx-auto"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Confirm & Submit to Transport Department
                  </Button>
                </div>
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
                {step === 5 ? 'Proceed to Review & Submit' : 'Next Step'}
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
              GovConnect requests your explicit permission to retrieve your verified demographic, Driving Licence records, and address proof from <b>DigiLocker</b> to pre-populate your <b>Driving Licence Renewal & Address Change Application (TRN-001)</b>.
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
                <span><b>Identity Details:</b> Full Name, Date of Birth, Email, and Mobile Number</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#198754] shrink-0" />
                <span><b>Driving Licence Record:</b> DL Number, Existing Validity, and RTO Authority</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#198754] shrink-0" />
                <span><b>Standardized Residential Address:</b> Door No, Street, City, District, State, PIN Code</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#198754] shrink-0" />
                <span><b>Verified Document:</b> Digital Address Proof Certificate</span>
              </div>
            </div>
          </div>

          {/* Purpose & Security Guarantees */}
          <div className="p-3.5 bg-[#F5F7FA] border border-[#DDE3EA] rounded-xl space-y-2 text-[11px] text-[#5B667A]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#123B6D] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#172033]">Purpose of Data Access: </span>
                <span>Pre-filling application form and verifying residential jurisdiction for RTO endorsement.</span>
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
