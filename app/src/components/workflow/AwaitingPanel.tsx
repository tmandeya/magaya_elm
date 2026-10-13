// src/components/workflow/AwaitingPanel.tsx
// Employees whose status says onboarding/offboarding but who have no process
// running yet — so nobody falls through the cracks between HR status changes
// and the departmental workflow.
import { useState } from "react";
import { Clock, Play, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AwaitingPerson { id: string; name: string; code: string; site: string; department: string; }

export default function AwaitingPanel({ people, kind, onStart, onStartAll }: {
  people: AwaitingPerson[];
  kind: "onboarding" | "offboarding";
  onStart: (id: string) => void;
  onStartAll?: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  if (people.length === 0) return null;
  const accent = kind === "offboarding" ? "#B91C1C" : "#1B7A43";
  const shown = open ? people.slice(0, 50) : [];
  return (
    <div className="mb-5 bg-white border border-[#DDDDDD] rounded-[6px] overflow-hidden" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${accent}14` }}><Clock className="w-4 h-4" style={{ color: accent }} /></div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-black">{people.length} {people.length === 1 ? "employee" : "employees"} waiting for {kind} to start</div>
          <div className="text-[12px] text-[#6B6B6B]">Marked as {kind === "offboarding" ? "Offboarding" : "Onboarding"} in Employee Master Data, but no {kind} process has been started yet.</div>
        </div>
        {onStartAll && people.length > 1 && (
          <button onClick={() => onStartAll(people.map((p) => p.id))} className="h-8 px-3 rounded-md text-[12px] font-semibold bg-[#EDC817] hover:bg-[#D9B60F] text-black flex items-center gap-1.5"><Play className="w-3.5 h-3.5" />Start for all {people.length}</button>
        )}
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-md hover:bg-[#FAFAFA] text-[#6B6B6B]" title={open ? "Hide" : "Show"}><ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} /></button>
      </div>
      {open && (
        <div className="border-t border-[#EEEEEE] divide-y divide-[#EEEEEE]">
          {shown.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAFA]">
              <div className="w-8 h-8 rounded-full bg-[#EEEEEE] text-[#525252] text-[11px] font-bold flex items-center justify-center shrink-0">{p.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
              <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-black truncate">{p.name} <span className="text-[#9C9C9C] font-normal">({p.code})</span></div><div className="text-[11px] text-[#6B6B6B] truncate">{p.site} · {p.department}</div></div>
              <button onClick={() => onStart(p.id)} className="h-8 px-3 rounded-md text-[12px] font-semibold border-2 flex items-center gap-1.5 transition-colors hover:text-white" style={{ borderColor: accent, color: accent }}
                onMouseEnter={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = accent; }}>
                <Play className="w-3.5 h-3.5" />Start {kind}
              </button>
            </div>
          ))}
          {people.length > 50 && <div className="px-4 py-2 text-[12px] text-[#9C9C9C]">+{people.length - 50} more — use Start for all, or the employee picker in the wizard.</div>}
        </div>
      )}
    </div>
  );
}
