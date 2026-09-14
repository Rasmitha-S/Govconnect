import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '../../types/index.js';

interface TimelineProps {
  steps: WorkflowStep[];
  currentStage: number;
}

export const Timeline: React.FC<TimelineProps> = ({ steps, currentStage }) => {
  return (
    <div className="relative pl-6 space-y-7 before:absolute before:left-[17px] before:top-3.5 before:bottom-3.5 before:w-0.5 before:bg-[#DDE3EA]">
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'COMPLETED';
        const isInProgress = step.status === 'IN_PROGRESS' || (!isCompleted && step.stageNumber === currentStage);
        const isFailed = step.status === 'FAILED';
        const isPending = !isCompleted && !isInProgress && !isFailed;

        return (
          <div key={step.id || idx} className="relative flex items-start gap-4 group">
            {/* Step Icon Indicator */}
            <div
              className={`absolute -left-6 flex items-center justify-center w-9 h-9 rounded-full border-2 bg-white transition-all shadow-gov-sm ${
                isCompleted
                  ? 'border-[#198754] text-[#198754]'
                  : isInProgress
                  ? 'border-[#123B6D] text-[#123B6D] ring-4 ring-[#EBF3FA] animate-pulse'
                  : isFailed
                  ? 'border-[#C0392B] text-[#C0392B]'
                  : 'border-[#DDE3EA] text-[#5B667A]'
              }`}
            >
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-[#198754]" />}
              {isInProgress && <Clock className="w-5 h-5 text-[#123B6D]" />}
              {isFailed && <AlertCircle className="w-5 h-5 text-[#C0392B]" />}
              {isPending && <Circle className="w-4 h-4 text-[#5B667A]/60" />}
            </div>

            {/* Step Content Card */}
            <div className="flex-1 bg-white border border-[#DDE3EA] shadow-gov-sm hover:border-[#B9D4EE] rounded-xl p-4 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#123B6D] bg-[#EBF3FA] border border-[#B9D4EE]/60 px-2 py-0.5 rounded">
                    Stage {step.stageNumber}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#172033]">{step.stageName}</h4>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {step.connectorName && (
                    <span className="bg-[#E6F4F5] text-[#087F8C] border border-[#B2E2E6] px-2 py-0.5 rounded-md font-semibold text-[11px] flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#087F8C]" />
                      {step.connectorName}
                    </span>
                  )}
                  {step.executionDurationMs !== undefined && (
                    <span className="text-[#5B667A] font-mono text-[11px] bg-[#F5F7FA] px-1.5 py-0.5 rounded border border-[#DDE3EA]">
                      {step.executionDurationMs}ms
                    </span>
                  )}
                  <span
                    className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-[#E8F5E9] text-[#198754] border-[#A3E9B9]'
                        : isInProgress
                        ? 'bg-[#EBF3FA] text-[#123B6D] border-[#B9D4EE]'
                        : isFailed
                        ? 'bg-[#FDEDEC] text-[#C0392B] border-[#F5B7B1]'
                        : 'bg-[#F0F3F7] text-[#5B667A] border-[#DDE3EA]'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
              </div>

              {step.errorMessage && (
                <div className="mt-2.5 text-xs text-[#C0392B] bg-[#FDEDEC] border border-[#F5B7B1] rounded-lg p-2.5 font-medium">
                  {step.errorMessage}
                </div>
              )}

              {step.completedAt && (
                <p className="text-[11px] text-[#5B667A] mt-2">
                  Completed on {new Date(step.completedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
