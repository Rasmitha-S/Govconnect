import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Send, Sparkles, CheckCircle2, Building2, Clock, PlusCircle } from 'lucide-react';
import { grievanceApi, aiApi } from '../api/client.js';
import { Grievance } from '../types/index.js';
import { Card, CardHeader } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';

const grievanceSchema = z.object({
  description: z.string().min(10, 'Please describe your grievance with at least 10 characters'),
  category: z.string().optional(),
});

type GrievanceFormData = z.infer<typeof grievanceSchema>;

export const GrievancePage: React.FC = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
  });

  const descriptionValue = watch('description');

  const fetchGrievances = async () => {
    try {
      const res = await grievanceApi.listMy();
      if (res.success && res.data) {
        setGrievances(res.data);
      }
    } catch (err) {
      console.error('Error fetching grievances', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  // Live debounce AI grievance classification preview
  useEffect(() => {
    if (descriptionValue && descriptionValue.length > 12) {
      const timer = setTimeout(async () => {
        try {
          const res = await aiApi.classifyGrievance(descriptionValue);
          if (res.success && res.data) {
            setAiPreview(res.data);
          }
        } catch {}
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAiPreview(null);
    }
  }, [descriptionValue]);

  const onSubmit = async (data: GrievanceFormData) => {
    setIsSubmitting(true);
    try {
      const res = await grievanceApi.submit({
        description: data.description,
        category: aiPreview?.category || 'General Inquiry',
        departmentCode: aiPreview?.departmentCode,
      });

      if (res.success) {
        reset();
        setAiPreview(null);
        await fetchGrievances();
      }
    } catch (err) {
      console.error('Submit grievance error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F5F7FA]">
      <div className="space-y-2">
        <Badge variant="primary" size="md">Public Grievance Redressal</Badge>
        <h1 className="text-3xl font-extrabold text-[#172033]">Submit & Track Grievance</h1>
        <p className="text-xs sm:text-sm text-[#5B667A] max-w-2xl leading-relaxed">
          Powered by GovConnect AI auto-routing. Your complaint is automatically classified and delivered directly to the responsible Department Officer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col (5 cols): File New Grievance Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#DDE3EA]">
            <CardHeader
              title="File New Grievance"
              subtitle="AI classifies & assigns to correct department"
              icon={<PlusCircle className="w-5 h-5 text-[#123B6D]" />}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Describe the Issue / Grievance: <span className="text-[#C0392B]">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="e.g. My municipal water meter is showing an incorrect reading or my pipeline has low pressure..."
                  className="w-full p-3 text-xs text-[#172033] bg-white border border-[#DDE3EA] rounded-lg focus:ring-2 focus:ring-[#123B6D]/20 focus:border-[#123B6D] outline-none shadow-gov-sm"
                />
                {errors.description && (
                  <p className="text-[11px] font-medium text-[#C0392B] mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* AI Auto-Classification Live Preview Box */}
              {aiPreview && (
                <div className="p-3.5 bg-[#EBF3FA] border border-[#B9D4EE] rounded-xl space-y-1.5 text-xs text-[#172033] animate-fadeIn shadow-gov-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[#123B6D] text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-[#F4A340]" />
                      <span>AI Classification Preview</span>
                    </span>
                    <Badge variant={aiPreview.priority === 'URGENT' ? 'danger' : 'info'} size="sm">
                      {aiPreview.priority} Priority
                    </Badge>
                  </div>

                  <p className="text-[11px]">
                    <b>Routing to:</b> {aiPreview.departmentName}
                  </p>
                  <p className="text-[11px]">
                    <b>Category:</b> {aiPreview.category}
                  </p>
                  <p className="text-[10px] text-[#5B667A]">
                    Est. Resolution: ~{aiPreview.estimatedResolutionDays} days
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Submit Grievance
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Col (7 cols): Submitted Grievances */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-[#DDE3EA]">
            <CardHeader
              title="My Registered Grievances"
              subtitle="Live status updates from Department Officers"
              icon={<AlertCircle className="w-5 h-5 text-[#123B6D]" />}
            />

            {isLoading ? (
              <div className="py-6 space-y-3">
                <Skeleton variant="rectangular" count={3} />
              </div>
            ) : grievances.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="w-8 h-8 text-[#123B6D]" />}
                title="No Grievances Registered"
                description="Any complaints or grievances you file will appear here with live tracking updates."
              />
            ) : (
              <div className="space-y-4">
                {grievances.map((grv) => (
                  <div
                    key={grv.id}
                    className="p-4 bg-white rounded-xl border border-[#DDE3EA] shadow-gov-sm space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#123B6D] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#B9D4EE]">
                          {grv.grievanceNumber}
                        </span>
                        <span className="font-bold text-[#172033]">• {grv.category}</span>
                      </div>
                      <Badge
                        variant={
                          grv.status === 'RESOLVED'
                            ? 'success'
                            : grv.status === 'IN_PROGRESS'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {grv.status}
                      </Badge>
                    </div>

                    <p className="text-[#5B667A] leading-relaxed">{grv.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#5B667A] pt-2 border-t border-[#DDE3EA]">
                      <span>Assigned: <b>{grv.department?.name}</b></span>
                      <span>{new Date(grv.createdAt).toLocaleDateString()}</span>
                    </div>

                    {grv.resolutionRemarks && (
                      <div className="p-3 bg-[#E8F5E9] border border-[#A3E9B9] rounded-lg text-[#172033] text-xs space-y-1">
                        <span className="font-bold text-[#198754] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Officer Resolution Remarks:
                        </span>
                        <p className="italic">"{grv.resolutionRemarks}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
