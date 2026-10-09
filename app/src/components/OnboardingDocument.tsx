// src/components/OnboardingDocument.tsx
// Onboarding completion record, generated from live workflow data once HR
// gives final sign-off. A4 print layout via @media print. Lists what each
// department provisioned and who signed off when. No sensitive personal data
// (ID numbers, banking, salary) is included.

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { LiveOnboardingWorkflow, LiveTask } from "@/hooks/useOnboarding";

function fmt(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function listOf(v: unknown): string {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "None requested";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

const DEPARTMENT_LABEL: Record<string, string> = {
  hr_initiation: "Human Resources — Initiation",
  security_clearance: "Security",
  it_provisioning: "Information Technology",
  admin_setup: "Administration",
  hod_acknowledgment: "Head of Department",
  hr_completion: "Human Resources — Final Sign-off",
};

export default function OnboardingDocument({ workflow, open, onClose }: {
  workflow: LiveOnboardingWorkflow;
  open: boolean;
  onClose: () => void;
}) {
  const allTasks: LiveTask[] = workflow.stages.flatMap((s) => s.tasks ?? []);
  const req = (key: string) => allTasks.find((t) => t.requestData && key in t.requestData)?.requestData?.[key];

  const provisioning = [
    { label: "Devices", value: listOf(req("requested_hardware")) },
    { label: "Software", value: listOf(req("requested_software")) },
    { label: "Clearance level", value: listOf(req("requested_level")) },
    { label: "Vehicle access card", value: listOf(req("vehicle_card_requested")) },
    { label: "Parking", value: listOf(req("parking_requested")) },
    { label: "Administration requests", value: listOf(req("admin_requests")) },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[860px] max-h-[90vh] overflow-y-auto p-0" aria-describedby={undefined}>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #onboarding-document, #onboarding-document * { visibility: visible !important; }
            #onboarding-document { position: absolute; inset: 0; width: 100%; padding: 0 !important; }
            @page { size: A4; margin: 1.6cm; }
          }
        `}</style>
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#DDDDDD] print:hidden">
          <span className="text-[14px] font-semibold text-[#000000]">Onboarding Completion Record</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black text-[12px] h-8">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save as PDF
            </Button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-[#525252] hover:bg-[#FAFAFA]"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div id="onboarding-document" className="px-12 py-10 bg-white text-[#000000]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="flex items-center justify-between mb-8 pb-5 border-b-2 border-[#000000]">
            <img src="/magaya_logo.png" alt="Magaya Mining" className="h-[52px] w-auto" />
            <div className="text-right text-[11px] text-[#525252] leading-relaxed">
              <div className="text-[13px] font-bold text-[#000000]">Magaya Mining (Private) Limited</div>
              <div>Human Resources Department</div>
              <div>Reference {workflow.reference}</div>
            </div>
          </div>

          <h1 className="text-[18px] font-bold tracking-wide mb-1">EMPLOYEE ONBOARDING COMPLETION RECORD</h1>
          <p className="text-[12px] text-[#525252] mb-6">Confirms that all departmental onboarding requirements were completed and signed off.</p>

          <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#8C7600] mb-2">Employee</h2>
          <table className="w-full text-[12px] mb-6 border border-[#DDDDDD]">
            <tbody>
              {[
                ["Name", workflow.employee.name, "Employee ID", workflow.employee.code],
                ["Site", workflow.employee.site, "Department", workflow.employee.department],
                ["Position", workflow.doc.position ?? "—", "Employment type", workflow.doc.employmentType ?? "—"],
                ["Start date", fmt(workflow.doc.startDate), "Work email", workflow.doc.workEmail ?? "—"],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-[#DDDDDD] last:border-0">
                  <td className="px-3 py-2 bg-[#FAFAFA] font-semibold w-[18%]">{r[0]}</td>
                  <td className="px-3 py-2 w-[32%]">{r[1]}</td>
                  <td className="px-3 py-2 bg-[#FAFAFA] font-semibold w-[18%]">{r[2]}</td>
                  <td className="px-3 py-2 w-[32%]">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#8C7600] mb-2">Provisioning requested at initiation</h2>
          <table className="w-full text-[12px] mb-6 border border-[#DDDDDD]">
            <tbody>
              {provisioning.map((p) => (
                <tr key={p.label} className="border-b border-[#DDDDDD] last:border-0">
                  <td className="px-3 py-2 bg-[#FAFAFA] font-semibold w-[28%]">{p.label}</td>
                  <td className="px-3 py-2">{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#8C7600] mb-2">Departmental sign-off</h2>
          <div className="space-y-3 mb-8">
            {workflow.stages.map((s) => (
              <div key={s.id} className="border border-[#DDDDDD] rounded-md" style={{ breakInside: "avoid" }}>
                <div className="flex items-center justify-between px-3 py-2 bg-[#FAFAFA] border-b border-[#DDDDDD]">
                  <span className="text-[12px] font-bold">{DEPARTMENT_LABEL[s.stageKey] ?? s.name}</span>
                  <span className="text-[11px] text-[#525252]">
                    {s.status === "completed" ? <>Signed off by <strong className="text-[#000000]">{s.completedBy ?? "—"}</strong> on {fmt(s.completedDate)}</> : "Not signed off"}
                  </span>
                </div>
                <ul className="px-3 py-2 text-[11px] space-y-1">
                  {(s.tasks ?? []).map((t) => (
                    <li key={t.id} className="flex gap-2">
                      <span className="w-[54px] shrink-0 font-semibold" style={{ color: t.dbStatus === "completed" ? "#1B7A43" : "#6B6B6B" }}>
                        {t.dbStatus === "completed" ? "Done" : t.dbStatus === "not_applicable" ? "N/A" : t.dbStatus === "skipped" ? "Skipped" : "Open"}
                      </span>
                      <span>{t.label}{t.notes ? <span className="text-[#6B6B6B]"> — {t.notes}</span> : null}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-[12px] leading-relaxed mb-10">
            Onboarding was completed on <strong>{fmt(workflow.doc.completedAt)}</strong>. The employee is recorded as active in the
            Magaya employee database with effect from that date.
          </p>

          <div className="grid grid-cols-2 gap-10 text-[12px]">
            {["Employee", "Human Resources"].map((who) => (
              <div key={who}>
                <div className="border-b border-[#000000] h-10" />
                <div className="font-semibold mt-1">{who}</div>
                <div className="text-[11px] text-[#525252]">Signature and date</div>
              </div>
            ))}
          </div>

          <div className="pt-6 mt-10 text-[10px] text-[#9C9C9C] border-t border-[#DDDDDD]">
            Generated by Magaya ELMS on {fmt(new Date().toISOString())} · {workflow.reference} · Produced from the completed onboarding workflow and its recorded departmental sign-offs.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
