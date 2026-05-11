import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, ChevronDown, ChevronUp, ChevronsUpDown, Download,
  Eye, Pencil, Trash2, X, Columns3, Check
} from "lucide-react";
import { employees, sites } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import type { Employee, EmployeeStatus, Department } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Extended employee type with extra fields ───────────────────────────────
interface ExtendedEmployee extends Employee {
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  nationalId?: string;
  nationality?: string;
  code?: string;
  position?: string;
  homeAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  employeeType?: "Permanent" | "Contract" | "Casual" | "Intern";
  jobGrade?: string;
  contractStart?: string;
  contractEnd?: string | null;
  costCentre?: string;
  yearsOfExperience?: number;
  academicQualifications?: string;
  reportingLineName?: string;
}

// ── Generate extended mock data with realistic Zimbabwean names ────────────
const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];

const EXTRA_FIELDS: Record<string, Partial<ExtendedEmployee>> = {
  "EMP-2024-001": { gender: "Male", dateOfBirth: "1985-03-15", nationalId: "88-1234567A88", nationality: "Zimbabwean", code: "MM-2024-0042", position: "Senior Mechanical Engineer", homeAddress: "45 Harare Drive, Harare", emergencyContactName: "Sarah Mutasa", emergencyContactPhone: "+263 772 999 888", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 7", contractStart: "2024-01-10", contractEnd: null, costCentre: "CC-001", yearsOfExperience: 12, academicQualifications: "BSc Mechanical Engineering (UZ), MSc (Wits)", reportingLineName: "Kudakwashe Mupini" },
  "EMP-2024-002": { gender: "Female", dateOfBirth: "1992-07-22", nationalId: "92-7654321B92", nationality: "Zimbabwean", code: "MM-2024-0039", position: "Human Resources Officer", homeAddress: "12 Mbuya Nehanda St, Harare", emergencyContactName: "Mary Mupfumi", emergencyContactPhone: "+263 773 111 222", emergencyContactRelationship: "Mother", employeeType: "Permanent", jobGrade: "Grade 5", contractStart: "2024-02-01", contractEnd: null, costCentre: "CC-002", yearsOfExperience: 5, academicQualifications: "BCom Accounting (NUST)", reportingLineName: "Faith Dube" },
  "EMP-2024-003": { gender: "Male", dateOfBirth: "1988-11-10", nationalId: "85-2345678D85", nationality: "Zimbabwean", code: "MM-2023-0187", position: "Head of Security", homeAddress: "78 Sekuru Kaguvi St, Harare", emergencyContactName: "Anna Katsande", emergencyContactPhone: "+263 774 333 444", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 8", contractStart: "2023-06-01", contractEnd: null, costCentre: "CC-004", yearsOfExperience: 15, academicQualifications: "Diploma in Security Management", reportingLineName: "Tendai Mutasa" },
  "EMP-2024-004": { gender: "Male", dateOfBirth: "1995-01-18", nationalId: "93-5678901F93", nationality: "Zimbabwean", code: "MM-2024-0035", position: "Systems Administrator", homeAddress: "23 Robert Mugabe Rd, Harare", emergencyContactName: "Joyce Mhlanga", emergencyContactPhone: "+263 775 555 666", emergencyContactRelationship: "Sister", employeeType: "Contract", jobGrade: "Grade 5", contractStart: "2024-03-15", contractEnd: "2025-03-14", costCentre: "CC-003", yearsOfExperience: 3, academicQualifications: "BSc Computer Science (NUST)", reportingLineName: "Nyasha Gomo" },
  "EMP-2024-005": { gender: "Female", dateOfBirth: "1982-06-25", nationalId: "87-6789012G87", nationality: "Zimbabwean", code: "MM-2022-0087", position: "HR Director", homeAddress: "56 Samora Machel Ave, Harare", emergencyContactName: "John Dube", emergencyContactPhone: "+263 776 777 888", emergencyContactRelationship: "Husband", employeeType: "Permanent", jobGrade: "Grade 9", contractStart: "2022-07-15", contractEnd: null, costCentre: "CC-008", yearsOfExperience: 18, academicQualifications: "MBA (UZ), BCom Business Management", reportingLineName: "Board" },
  "EMP-2024-006": { gender: "Male", dateOfBirth: "1979-09-05", nationalId: "91-8901234I91", nationality: "Zimbabwean", code: "MM-2023-0156", position: "Head of Department - HR", homeAddress: "89 Josiah Tongogara St, Harare", emergencyContactName: "Elizabeth Chirwa", emergencyContactPhone: "+263 777 999 000", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 8", contractStart: "2023-04-15", contractEnd: null, costCentre: "CC-005", yearsOfExperience: 20, academicQualifications: "BSc Geology (UZ), MSc Mineral Exploration (Cape Town)", reportingLineName: "Faith Dube" },
  "EMP-2024-007": { gender: "Female", dateOfBirth: "1987-12-12", nationalId: "90-3456789E90", nationality: "Zimbabwean", code: "MM-2022-0076", position: "Administrative Director", homeAddress: "34 Fourth St, Harare", emergencyContactName: "Michael Ncube", emergencyContactPhone: "+263 778 000 111", emergencyContactRelationship: "Husband", employeeType: "Permanent", jobGrade: "Grade 9", contractStart: "2022-03-01", contractEnd: null, costCentre: "CC-006", yearsOfExperience: 14, academicQualifications: "BCom Accounting (UZ), CA (Z), MBA", reportingLineName: "Board" },
  "EMP-2024-008": { gender: "Male", dateOfBirth: "1980-04-22", nationalId: "86-4567890P90", nationality: "Zimbabwean", code: "MM-2023-0145", position: "Security Director", homeAddress: "67 Kaguvi St, Harare", emergencyContactName: "Patricia Marufu", emergencyContactPhone: "+263 779 222 333", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 9", contractStart: "2022-08-15", contractEnd: null, costCentre: "CC-007", yearsOfExperience: 16, academicQualifications: "BSc Mining Engineering (UZ), Mine Managers Cert", reportingLineName: "Board" },
  "EMP-2024-009": { gender: "Male", dateOfBirth: "1984-08-30", nationalId: "89-9012345J89", nationality: "Zimbabwean", code: "MM-2024-0045", position: "IT Director", homeAddress: "90 Rotten Row, Harare", emergencyContactName: "Lisa Gomo", emergencyContactPhone: "+263 780 444 555", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 9", contractStart: "2021-11-01", contractEnd: null, costCentre: "CC-009", yearsOfExperience: 16, academicQualifications: "BSc Transport & Logistics (MSU)", reportingLineName: "Board" },
  "EMP-2024-010": { gender: "Male", dateOfBirth: "1990-02-14", nationalId: "96-0123456K96", nationality: "Zimbabwean", code: "MM-2022-0065", position: "Head of Department - IT", homeAddress: "11 Nyerere Way, Harare", emergencyContactName: "Anna Mhembere", emergencyContactPhone: "+263 781 666 777", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 8", contractStart: "2022-05-01", contractEnd: null, costCentre: "CC-010", yearsOfExperience: 10, academicQualifications: "BSc IT (Harare Institute of Technology)", reportingLineName: "Nyasha Gomo" },
  "EMP-2024-011": { gender: "Female", dateOfBirth: "1993-05-08", nationalId: "84-1234567L84", nationality: "Zimbabwean", code: "MM-2023-0134", position: "Senior Finance Officer", homeAddress: "22 Kwame Nkrumah Ave, Harare", emergencyContactName: "David Mhondera", emergencyContactPhone: "+263 782 888 999", emergencyContactRelationship: "Father", employeeType: "Permanent", jobGrade: "Grade 7", contractStart: "2022-04-01", contractEnd: null, costCentre: "CC-011", yearsOfExperience: 8, academicQualifications: "BCom Finance (UZ), ACCA", reportingLineName: "Faith Dube" },
  "EMP-2024-012": { gender: "Male", dateOfBirth: "1978-11-20", nationalId: "94-2345678M94", nationality: "Zimbabwean", code: "MM-2022-0091", position: "Senior Mine Manager", homeAddress: "33 Leopold Takawira St, Harare", emergencyContactName: "Ruth Mupfumi", emergencyContactPhone: "+263 783 000 111", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 10", contractStart: "2023-05-15", contractEnd: null, costCentre: "CC-012", yearsOfExperience: 22, academicQualifications: "BSc Mining Engineering (UZ), Mine Managers Cert", reportingLineName: "Board" },
  "EMP-2024-013": { gender: "Female", dateOfBirth: "1991-07-15", nationalId: "82-7890123H82", nationality: "Zimbabwean", code: "MM-2023-0123", position: "HR Officer", homeAddress: "44 Park Lane, Harare", emergencyContactName: "George Chikwamba", emergencyContactPhone: "+263 784 222 333", emergencyContactRelationship: "Brother", employeeType: "Permanent", jobGrade: "Grade 5", contractStart: "2023-03-01", contractEnd: null, costCentre: "CC-013", yearsOfExperience: 6, academicQualifications: "BSc Human Resources (MSU)", reportingLineName: "Faith Dube" },
  "EMP-2024-014": { gender: "Male", dateOfBirth: "1986-03-28", nationalId: "95-4567890C95", nationality: "Zimbabwean", code: "MM-2024-0048", position: "Site Administrator", homeAddress: "55 Jason Moyo Ave, Harare", emergencyContactName: "Grace Moyo", emergencyContactPhone: "+263 785 444 555", emergencyContactRelationship: "Mother", employeeType: "Permanent", jobGrade: "Grade 6", contractStart: "2024-05-01", contractEnd: null, costCentre: "CC-014", yearsOfExperience: 9, academicQualifications: "Diploma in Business Administration", reportingLineName: "Grace Ncube" },
  "EMP-2024-015": { gender: "Male", dateOfBirth: "1983-09-17", nationalId: "86-3456789N86", nationality: "Zimbabwean", code: "MM-2022-0098", position: "Senior Mechanical Engineer", homeAddress: "66 Central Ave, Harare", emergencyContactName: "Joyce Chingwara", emergencyContactPhone: "+263 786 666 777", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 8", contractStart: "2022-09-01", contractEnd: null, costCentre: "CC-014", yearsOfExperience: 16, academicQualifications: "BSc Mechanical Engineering (UZ), PrEng", reportingLineName: "John Mupfumi" },
  "EMP-2024-016": { gender: "Male", dateOfBirth: "1989-01-05", nationalId: "91-2345678S91", nationality: "Zimbabwean", code: "MM-2023-0110", position: "Senior Geologist", homeAddress: "77 Speke Ave, Harare", emergencyContactName: "Maria Mupfuti", emergencyContactPhone: "+263 787 888 999", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 7", contractStart: "2023-02-15", contractEnd: null, costCentre: "CC-015", yearsOfExperience: 10, academicQualifications: "BSc Geology (UZ), MSc (Cape Town)", reportingLineName: "John Mupfumi" },
  "EMP-2024-017": { gender: "Male", dateOfBirth: "1981-06-12", nationalId: "85-8765432T85", nationality: "Zimbabwean", code: "MM-2023-0105", position: "Processing Plant Manager", homeAddress: "88 Manica Rd, Harare", emergencyContactName: "Esther Makoni", emergencyContactPhone: "+263 788 000 111", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 9", contractStart: "2022-08-15", contractEnd: null, costCentre: "CC-016", yearsOfExperience: 18, academicQualifications: "BSc Metallurgical Engineering (UZ)", reportingLineName: "John Mupfumi" },
  "EMP-2024-018": { gender: "Female", dateOfBirth: "1988-12-03", nationalId: "93-3456789U93", nationality: "Zimbabwean", code: "MM-2023-0095", position: "Health & Safety Manager", homeAddress: "99 Abercorn St, Harare", emergencyContactName: "Thomas Sibanda", emergencyContactPhone: "+263 789 222 333", emergencyContactRelationship: "Husband", employeeType: "Permanent", jobGrade: "Grade 7", contractStart: "2023-01-10", contractEnd: null, costCentre: "CC-017", yearsOfExperience: 11, academicQualifications: "BSc Environmental Health (UZ), NEBOSH Cert", reportingLineName: "John Mupfumi" },
  "EMP-2024-019": { gender: "Male", dateOfBirth: "1996-04-25", nationalId: "97-4567890V97", nationality: "Zimbabwean", code: "MM-2024-0055", position: "Chief Maintenance Officer", homeAddress: "110 Livingstone Ave, Harare", emergencyContactName: "Rose Mushonga", emergencyContactPhone: "+263 790 444 555", emergencyContactRelationship: "Mother", employeeType: "Contract", jobGrade: "Grade 6", contractStart: "2024-06-01", contractEnd: "2025-05-31", costCentre: "CC-018", yearsOfExperience: 4, academicQualifications: "HND in Electrical Engineering", reportingLineName: "John Mupfumi" },
  "EMP-2024-020": { gender: "Female", dateOfBirth: "1994-10-10", nationalId: "92-5678901W92", nationality: "Zimbabwean", code: "MM-2024-0018", position: "HR Assistant", homeAddress: "121 George Silundika Ave, Harare", emergencyContactName: "Joseph Mashaya", emergencyContactPhone: "+263 791 666 777", emergencyContactRelationship: "Father", employeeType: "Contract", jobGrade: "Grade 4", contractStart: "2024-01-15", contractEnd: "2025-01-14", costCentre: "CC-019", yearsOfExperience: 3, academicQualifications: "Diploma in Human Resources", reportingLineName: "Rudo Chikwamba" },
  "EMP-2024-021": { gender: "Male", dateOfBirth: "1987-08-18", nationalId: "89-6789012X89", nationality: "Zimbabwean", code: "MM-2023-0088", position: "Security Supervisor", homeAddress: "132 Herbert Chitepo St, Harare", emergencyContactName: "Priscilla Mudzviti", emergencyContactPhone: "+263 792 888 999", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 6", contractStart: "2023-04-01", contractEnd: null, costCentre: "CC-020", yearsOfExperience: 9, academicQualifications: "Diploma in Security Management", reportingLineName: "Tatenda Marufu" },
  "EMP-2024-022": { gender: "Male", dateOfBirth: "1992-02-07", nationalId: "95-7890123Y95", nationality: "Zimbabwean", code: "MM-2024-0028", position: "IT Support Specialist", homeAddress: "143 Nelson Mandela Ave, Harare", emergencyContactName: " Catherine Machingura", emergencyContactPhone: "+263 793 000 111", emergencyContactRelationship: "Sister", employeeType: "Permanent", jobGrade: "Grade 5", contractStart: "2024-02-15", contractEnd: null, costCentre: "CC-021", yearsOfExperience: 5, academicQualifications: "BSc Computer Science (NUST)", reportingLineName: "Tafadzwa Mhembere" },
  "EMP-2024-023": { gender: "Female", dateOfBirth: "1985-07-30", nationalId: "88-8901234Z88", nationality: "Zimbabwean", code: "MM-2023-0075", position: "Senior Accountant", homeAddress: "154 Sam Nujoma St, Harare", emergencyContactName: "Robert Mupindu", emergencyContactPhone: "+263 794 222 333", emergencyContactRelationship: "Husband", employeeType: "Permanent", jobGrade: "Grade 7", contractStart: "2022-06-01", contractEnd: null, costCentre: "CC-022", yearsOfExperience: 13, academicQualifications: "BCom Accounting (UZ), CA (Z)", reportingLineName: "Samantha Mhondera" },
  "EMP-2024-024": { gender: "Male", dateOfBirth: "1980-05-14", nationalId: "83-9012345A83", nationality: "Zimbabwean", code: "MM-2022-0058", position: "Senior Mine Surveyor", homeAddress: "165 Bulawayo Rd, Harare", emergencyContactName: "Dorothy Gorejena", emergencyContactPhone: "+263 795 444 555", emergencyContactRelationship: "Spouse", employeeType: "Permanent", jobGrade: "Grade 8", contractStart: "2022-10-01", contractEnd: null, costCentre: "CC-023", yearsOfExperience: 19, academicQualifications: "BSc Surveying (UZ)", reportingLineName: "John Mupfumi" },
  "EMP-2024-025": { gender: "Female", dateOfBirth: "1997-09-01", nationalId: "98-0123456B98", nationality: "Zimbabwean", code: "MM-2024-0060", position: "Operations Coordinator", homeAddress: "176 Churchill Rd, Harare", emergencyContactName: "Steven Mupambwa", emergencyContactPhone: "+263 796 666 777", emergencyContactRelationship: "Father", employeeType: "Intern", jobGrade: "Grade 2", contractStart: "2024-08-01", contractEnd: "2025-07-31", costCentre: "CC-024", yearsOfExperience: 0, academicQualifications: "BSc Operations Management (UZ)", reportingLineName: "Tendai Mutasa" },
};

// Merge base employees with extended fields
const allEmployees: ExtendedEmployee[] = employees.map((e) => ({
  ...e,
  ...(EXTRA_FIELDS[e.id] || {}),
  // Fallback gender assignment based on name patterns for those without data
  gender: (EXTRA_FIELDS[e.id]?.gender) || (e.id.charCodeAt(e.id.length - 1) % 2 === 0 ? "Female" : "Male") as "Male" | "Female" | "Other",
}));

// ── Constants ──────────────────────────────────────────────────────────────
const DEPARTMENTS: Department[] = [
  "Human Resources", "Security", "Information Technology", "Operations",
  "Finance", "Engineering", "Administration", "Health & Safety",
  "Mining", "Geology", "Processing", "Maintenance"
];

const STATUSES: EmployeeStatus[] = ["Active", "Onboarding", "Transferred", "Offboarding", "Terminated", "Archived"];

const STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-[#E8F5EC]", text: "text-[#1B7A43]", dot: "bg-[#1B7A43]" },
  Onboarding: { bg: "bg-[#FDF3E0]", text: "text-[#C27A06]", dot: "bg-[#C27A06]" },
  Transferred: { bg: "bg-[#E8F2FA]", text: "text-[#1E6BA3]", dot: "bg-[#1E6BA3]" },
  Offboarding: { bg: "bg-[#FFF1F0]", text: "text-[#B91C1C]", dot: "bg-[#B91C1C]" },
  Terminated: { bg: "bg-[#F5F5F5]", text: "text-[#737373]", dot: "bg-[#737373]" },
  Archived: { bg: "bg-[#FAFAFA]", text: "text-[#9C9C9C]", dot: "bg-[#9C9C9C]" },
};

type SortField = "code" | "fullName" | "site" | "department" | "position" | "status" | "phone" | "email" | "gender";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  siteIds: number[];
  departments: string[];
  statuses: EmployeeStatus[];
  gender: string;
  grade: string[];
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: EmployeeStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function EmpAvatar({ emp, size = 32 }: { emp: ExtendedEmployee; size?: number }) {
  if (emp.photoUrl) {
    return <img src={emp.photoUrl} alt={emp.firstName} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full bg-[#D4A017] flex items-center justify-center text-white font-semibold" style={{ width: size, height: size, fontSize: size < 36 ? 11 : 14 }}>
      {emp.initials}
    </div>
  );
}

// ── Sort Icon ──────────────────────────────────────────────────────────────
function SortIcon({ field, currentField, dir }: { field: SortField; currentField: SortField; dir: SortDir }) {
  if (field !== currentField) return <ChevronsUpDown className="w-3 h-3 text-[#C4C3BF] opacity-0 group-hover:opacity-100 transition-opacity" />;
  return dir === "asc" ? <ChevronUp className="w-3 h-3 text-[#D4A017]" /> : <ChevronDown className="w-3 h-3 text-[#D4A017]" />;
}

// ── Filter Pill ────────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] text-[#D4A017]">
      {label}
      <button onClick={onRemove} className="hover:text-[#A67C0A] transition-colors"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ── Column visibility default ──────────────────────────────────────────────
const DEFAULT_VISIBLE_COLS: Record<string, boolean> = {
  code: true, photo: true, fullName: true, site: true, department: true,
  position: true, status: true, phone: true, email: true, gender: true, actions: true,
};

// ── Main Page Component ────────────────────────────────────────────────────
export default function Employees() {
  const navigate = useNavigate();
  useAuth(); // ensure auth context is available

  // ── State ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    search: "", siteIds: [], departments: [], statuses: ["Active"], gender: "All", grade: [],
  });
  const [sortField, setSortField] = useState<SortField>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS);
  const [colDropdownOpen, setColDropdownOpen] = useState(false);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ExtendedEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<ExtendedEmployee | null>(null);
  const [localEmployees, setLocalEmployees] = useState(allEmployees);

  // Form state (simplified for new/edit)
  const [formTab, setFormTab] = useState("personal");
  const [formData, setFormData] = useState<Partial<ExtendedEmployee>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    let data = [...localEmployees];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((e) =>
        e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q)) || e.email.toLowerCase().includes(q) ||
        e.phone.includes(q)
      );
    }
    if (filters.siteIds.length > 0) data = data.filter((e) => filters.siteIds.includes(e.siteId));
    if (filters.departments.length > 0) data = data.filter((e) => filters.departments.includes(e.department));
    if (filters.statuses.length > 0) data = data.filter((e) => filters.statuses.includes(e.status));
    if (filters.gender !== "All") data = data.filter((e) => e.gender === filters.gender);

    data.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "code": return ((a.code ?? "") > (b.code ?? "") ? 1 : -1) * dir;
        case "fullName": return ((a.firstName + " " + a.lastName) > (b.firstName + " " + b.lastName) ? 1 : -1) * dir;
        case "site": return ((getSiteName(a.siteId) ?? "") > (getSiteName(b.siteId) ?? "") ? 1 : -1) * dir;
        case "department": return (a.department > b.department ? 1 : -1) * dir;
        case "position": return ((a.position ?? a.jobTitle) > (b.position ?? b.jobTitle) ? 1 : -1) * dir;
        case "status": return (a.status > b.status ? 1 : -1) * dir;
        case "phone": return (a.phone > b.phone ? 1 : -1) * dir;
        case "email": return (a.email > b.email ? 1 : -1) * dir;
        case "gender": return ((a.gender ?? "") > (b.gender ?? "") ? 1 : -1) * dir;
        default: return 0;
      }
    });
    return data;
  }, [localEmployees, filters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getSiteName = useCallback((siteId: number) => sites.find((s) => s.id === siteId)?.fullName ?? "Unknown", []);

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedEmployees.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedEmployees.map((e) => e.id)));
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearFilters = () => setFilters({ search: "", siteIds: [], departments: [], statuses: [], gender: "All", grade: [] });

  const activeFilterCount = (filters.siteIds.length > 0 ? 1 : 0) + (filters.departments.length > 0 ? 1 : 0) + (filters.statuses.length !== 1 || filters.statuses[0] !== "Active" ? 1 : 0) + (filters.gender !== "All" ? 1 : 0) + filters.grade.length;

  const openNewModal = () => {
    setFormData({ status: "Active", employeeType: "Permanent", nationality: "Zimbabwean", siteId: 1, department: "Operations" });
    setFormErrors({});
    setFormTab("personal");
    setIsNewModalOpen(true);
  };

  const openEditModal = (emp: ExtendedEmployee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setFormErrors({});
    setFormTab("personal");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (emp: ExtendedEmployee) => {
    setDeletingEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (deletingEmployee) {
      setLocalEmployees((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(deletingEmployee.id); return n; });
      setDeletingEmployee(null);
      setIsDeleteModalOpen(false);
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName?.trim()) errs.firstName = "First name is required";
    if (!formData.lastName?.trim()) errs.lastName = "Surname is required";
    if (!formData.email?.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+$/.test(formData.email)) errs.email = "Invalid email";
    if (!formData.phone?.trim()) errs.phone = "Phone is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveNew = () => {
    if (!validateForm()) return;
    const id = `EMP-2024-${String(localEmployees.length + 1).padStart(3, "0")}`;
    const code = `MM-2024-${String(1000 + localEmployees.length + 1)}`;
    const newEmp: ExtendedEmployee = {
      id,
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      email: formData.email || "",
      phone: formData.phone || "",
      employeeNumber: `MAG-${String(localEmployees.length + 1).padStart(3, "0")}`,
      siteId: (formData.siteId as number) || 1,
      department: (formData.department as Department) || "Operations",
      role: "Employee",
      jobTitle: formData.jobTitle || "",
      status: (formData.status as EmployeeStatus) || "Active",
      hireDate: formData.contractStart || new Date().toISOString().split("T")[0],
      initials: `${(formData.firstName?.[0] ?? "")}${(formData.lastName?.[0] ?? "")}`.toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      code,
      gender: (formData.gender as "Male" | "Female" | "Other") || "Male",
      position: formData.jobTitle || "",
      nationality: formData.nationality || "Zimbabwean",
      employeeType: (formData.employeeType as "Permanent" | "Contract" | "Casual" | "Intern") || "Permanent",
      jobGrade: formData.jobGrade || "Grade 1",
      contractStart: formData.contractStart,
      contractEnd: formData.contractEnd || null,
      costCentre: formData.costCentre || "",
    };
    setLocalEmployees((prev) => [newEmp, ...prev]);
    setIsNewModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (!validateForm() || !editingEmployee) return;
    setLocalEmployees((prev) => prev.map((e) => e.id === editingEmployee.id ? { ...e, ...formData, updatedAt: new Date().toISOString() } as ExtendedEmployee : e));
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleExportCSV = () => {
    const rows = selectedIds.size > 0 ? localEmployees.filter((e) => selectedIds.has(e.id)) : filteredEmployees;
    const csv = [
      ["Employee Code", "First Name", "Last Name", "Site", "Department", "Position", "Status", "Phone", "Email", "Gender"].join(","),
      ...rows.map((e) => [
        e.code || "", e.firstName, e.lastName, getSiteName(e.siteId), e.department,
        e.position || e.jobTitle, e.status, e.phone, e.email, e.gender || ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employees.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Form Field Helpers ───────────────────────────────────────────────────
  const FormField = ({ label, name, type = "text", required = false, placeholder = "", options }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; options?: string[] }) => (
    <div className="mb-4">
      <Label className="text-[13px] font-medium text-[#525252] mb-1.5 block">{label}{required && <span className="text-[#B91C1C] ml-0.5">*</span>}</Label>
      {type === "select" && options ? (
        <Select value={String(formData[name as keyof typeof formData] ?? "")} onValueChange={(v) => setFormData((p) => ({ ...p, [name]: v }))}>
          <SelectTrigger className="h-[40px] border-[#E5E4E0] rounded-md text-[14px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <Textarea value={String(formData[name as keyof typeof formData] ?? "")} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} placeholder={placeholder} className="border-[#E5E4E0] rounded-md text-[14px] min-h-[80px]" />
      ) : type === "date" ? (
        <Input type="date" value={String(formData[name as keyof typeof formData] ?? "")} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} className="h-[40px] border-[#E5E4E0] rounded-md text-[14px]" />
      ) : (
        <Input type={type} value={String(formData[name as keyof typeof formData] ?? "")} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} placeholder={placeholder} className={cn("h-[40px] border-[#E5E4E0] rounded-md text-[14px]", formErrors[name] && "border-[#B91C1C] ring-1 ring-[rgba(185,28,28,0.15)]")} />
      )}
      {formErrors[name] && <p className="text-[12px] text-[#B91C1C] mt-1">{formErrors[name]}</p>}
    </div>
  );

  const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div>
      <Tabs value={formTab} onValueChange={setFormTab}>
        <TabsList className="mb-4 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg">
          <TabsTrigger value="personal" className="text-[13px] data-[state=active]:text-[#D4A017] data-[state=active]:border-b-2 data-[state=active]:border-[#D4A017] rounded-none">Personal</TabsTrigger>
          <TabsTrigger value="employment" className="text-[13px] data-[state=active]:text-[#D4A017] data-[state=active]:border-b-2 data-[state=active]:border-[#D4A017] rounded-none">Employment</TabsTrigger>
          <TabsTrigger value="contact" className="text-[13px] data-[state=active]:text-[#D4A017] data-[state=active]:border-b-2 data-[state=active]:border-[#D4A017] rounded-none">Contact</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-0">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <FormField label="First Name" name="firstName" required />
              <FormField label="Surname" name="lastName" required />
              <FormField label="Date of Birth" name="dateOfBirth" type="date" />
              <FormField label="Gender" name="gender" type="select" options={["Male", "Female", "Other"]} />
              <FormField label="National ID" name="nationalId" placeholder="e.g. 88-1234567A88" />
              <FormField label="Nationality" name="nationality" type="select" options={["Zimbabwean", "South African", "Zambian", "Botswanan", "Other"]} />
            </div>
            <div>
              <FormField label="Photo URL" name="photoUrl" placeholder="https://..." />
              <FormField label="Home Address" name="homeAddress" type="textarea" placeholder="Full residential address" />
              <div className="border-t border-[#E5E4E0] pt-3 mt-2">
                <p className="text-[13px] font-semibold text-[#525252] mb-2">Emergency Contact</p>
                <FormField label="Contact Name" name="emergencyContactName" />
                <FormField label="Relationship" name="emergencyContactRelationship" />
                <FormField label="Contact Phone" name="emergencyContactPhone" />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="employment" className="mt-0">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <div className="mb-4">
                <Label className="text-[13px] font-medium text-[#525252] mb-1.5 block">Employee Code</Label>
                <Input value={isEdit ? (formData.code || "") : `MM-2024-${String(1000 + localEmployees.length + 1)}`} disabled className="h-[40px] bg-[#F5F5F5] text-[#9C9C9C] rounded-md text-[14px]" />
              </div>
              <FormField label="Job Title" name="jobTitle" required />
              <FormField label="Department" name="department" type="select" options={DEPARTMENTS} required />
              <FormField label="Site" name="siteId" type="select" options={sites.map((s) => s.fullName)} required />
              <FormField label="Employment Type" name="employeeType" type="select" options={["Permanent", "Contract", "Casual", "Intern"]} />
            </div>
            <div>
              <FormField label="Job Grade" name="jobGrade" type="select" options={GRADES} />
              <FormField label="Contract Start Date" name="contractStart" type="date" />
              <FormField label="Contract End Date" name="contractEnd" type="date" />
              <FormField label="Status" name="status" type="select" options={STATUSES} required />
              <FormField label="Cost Centre" name="costCentre" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="contact" className="mt-0">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <FormField label="Work Email" name="email" type="email" required placeholder="name@magayamining.co.zw" />
              <FormField label="Personal Email" name="personalEmail" type="email" />
              <FormField label="Phone" name="phone" required placeholder="+263 77X XXX XXX" />
              <FormField label="Years of Experience" name="yearsOfExperience" type="number" />
            </div>
            <div>
              <FormField label="Academic Qualifications" name="academicQualifications" type="textarea" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">Employee Master Data</h1>
          <p className="text-[13px] text-[#525252] mt-1">Manage and view all employee records</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-[40px] border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] hover:text-[#D4A017]" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button className="h-[40px] bg-[#D4A017] hover:bg-[#A67C0A] text-white font-semibold shadow-[0_4px_12px_rgba(212,160,23,0.25)]" onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-1.5" /> New Employee
          </Button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9C9C]" />
            <Input
              placeholder="Search by name, code, email, phone..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="pl-9 h-[36px] border-[#E5E4E0] text-[14px]"
            />
          </div>
          <Select value={filters.siteIds.length === 1 ? String(filters.siteIds[0]) : filters.siteIds.length > 1 ? "multiple" : "all"} onValueChange={(v) => setFilters((p) => ({ ...p, siteIds: v === "all" || v === "multiple" ? [] : [Number(v)] }))}>
            <SelectTrigger className="h-[36px] min-w-[160px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="All Sites" /></SelectTrigger>
            <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.departments.length === 1 ? filters.departments[0] : filters.departments.length > 1 ? "multiple" : "all"} onValueChange={(v) => setFilters((p) => ({ ...p, departments: v === "all" || v === "multiple" ? [] : [v] }))}>
            <SelectTrigger className="h-[36px] min-w-[160px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.statuses.length === 1 ? filters.statuses[0] : filters.statuses.length > 1 ? "multiple" : "all"} onValueChange={(v) => setFilters((p) => ({ ...p, statuses: v === "all" || v === "multiple" ? [] : [v as EmployeeStatus] }))}>
            <SelectTrigger className="h-[36px] min-w-[160px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.gender} onValueChange={(v) => setFilters((p) => ({ ...p, gender: v }))}>
            <SelectTrigger className="h-[36px] min-w-[120px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setColDropdownOpen(!colDropdownOpen)} className="h-[36px] px-3 border border-[#E5E4E0] rounded-md text-[14px] text-[#525252] hover:border-[#D4A017] transition-colors flex items-center gap-1.5">
                <Columns3 className="w-4 h-4" /> Columns
              </button>
              {colDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-[#E5E4E0] rounded-lg shadow-dropdown z-20 py-1">
                  {Object.keys(DEFAULT_VISIBLE_COLS).map((col) => (
                    <button key={col} onClick={() => { setVisibleCols((p) => ({ ...p, [col]: !p[col] })); }} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#FAFAF8] transition-colors text-left">
                      <div className={cn("w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors", visibleCols[col] ? "bg-[#D4A017] border-[#D4A017]" : "border-[#C4C3BF]")}>
                        {visibleCols[col] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="capitalize">{col === "fullName" ? "Full Name" : col === "code" ? "Code" : col}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#E5E4E0]">
            {filters.siteIds.length > 0 && <FilterPill label={`Site: ${sites.find((s) => s.id === filters.siteIds[0])?.name}${filters.siteIds.length > 1 ? ` +${filters.siteIds.length - 1}` : ""}`} onRemove={() => setFilters((p) => ({ ...p, siteIds: [] }))} />}
            {filters.departments.length > 0 && <FilterPill label={`Dept: ${filters.departments[0]}${filters.departments.length > 1 ? ` +${filters.departments.length - 1}` : ""}`} onRemove={() => setFilters((p) => ({ ...p, departments: [] }))} />}
            {filters.statuses.length > 0 && !(filters.statuses.length === 1 && filters.statuses[0] === "Active") && <FilterPill label={`Status: ${filters.statuses[0]}${filters.statuses.length > 1 ? ` +${filters.statuses.length - 1}` : ""}`} onRemove={() => setFilters((p) => ({ ...p, statuses: ["Active"] }))} />}
            {filters.gender !== "All" && <FilterPill label={`Gender: ${filters.gender}`} onRemove={() => setFilters((p) => ({ ...p, gender: "All" }))} />}
            <button onClick={clearFilters} className="text-[12px] text-[#D4A017] hover:underline ml-1">Clear all filters</button>
          </div>
        )}
      </div>

      {/* ── Bulk Actions Bar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="h-[40px] bg-[#D4A017] rounded-lg flex items-center px-4 gap-3 text-white">
          <span className="text-[13px] font-semibold">{selectedIds.size} employee{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="w-px h-5 bg-white/30" />
          <button onClick={handleExportCSV} className="text-[13px] font-medium hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
          <button onClick={() => { const ids = Array.from(selectedIds); const toDelete = localEmployees.find((e) => ids[0] === e.id); if (toDelete) openDeleteModal(toDelete); }} className="text-[13px] font-medium hover:underline flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
      )}

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF8] sticky top-0 z-10">
              <tr className="border-b border-[#E5E4E0]">
                <th className="w-[40px] px-4 py-3"><Checkbox checked={paginatedEmployees.length > 0 && selectedIds.size === paginatedEmployees.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></th>
                {visibleCols.code && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("code")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Code <SortIcon field="code" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.photo && <th className="w-[56px] px-2 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Photo</th>}
                {visibleCols.fullName && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("fullName")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Full Name <SortIcon field="fullName" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.site && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("site")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Site <SortIcon field="site" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.department && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("department")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Department <SortIcon field="department" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.position && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("position")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Position <SortIcon field="position" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.status && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("status")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Status <SortIcon field="status" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.phone && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("phone")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Phone <SortIcon field="phone" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.email && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("email")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Email <SortIcon field="email" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.gender && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("gender")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Gender <SortIcon field="gender" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.actions && <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((emp) => {
                const isSelected = selectedIds.has(emp.id);
                return (
                  <tr
                    key={emp.id}
                    className={cn(
                      "border-b border-[#E5E4E0] h-[56px] cursor-pointer transition-colors duration-100",
                      isSelected ? "bg-[rgba(212,160,23,0.06)] border-l-[3px] border-l-[#D4A017]" : "hover:bg-[#FAFAF8]"
                    )}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectRow(emp.id)} aria-label={`Select ${emp.firstName}`} />
                    </td>
                    {visibleCols.code && <td className="px-4 py-3 text-[13px] text-[#1A1A1A] font-medium whitespace-nowrap">{emp.code || "—"}</td>}
                    {visibleCols.photo && <td className="px-2 py-3"><EmpAvatar emp={emp} size={32} /></td>}
                    {visibleCols.fullName && <td className="px-4 py-3 text-[13px] text-[#1A1A1A] font-medium hover:text-[#D4A017] hover:underline transition-colors">{emp.firstName} {emp.lastName}</td>}
                    {visibleCols.site && <td className="px-4 py-3 text-[13px] text-[#525252]">{getSiteName(emp.siteId)}</td>}
                    {visibleCols.department && <td className="px-4 py-3 text-[13px] text-[#525252]">{emp.department}</td>}
                    {visibleCols.position && <td className="px-4 py-3 text-[13px] text-[#525252] max-w-[150px] truncate">{emp.position || emp.jobTitle}</td>}
                    {visibleCols.status && <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>}
                    {visibleCols.phone && <td className="px-4 py-3 text-[13px] text-[#525252] whitespace-nowrap">{emp.phone}</td>}
                    {visibleCols.email && <td className="px-4 py-3 text-[13px] text-[#525252] max-w-[180px] truncate">{emp.email}</td>}
                    {visibleCols.gender && <td className="px-4 py-3 text-[13px] text-[#525252]">{emp.gender}</td>}
                    {visibleCols.actions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 rounded-md hover:bg-[#FAFAF8] text-[#525252] hover:text-[#D4A017] transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(emp)} className="p-1.5 rounded-md hover:bg-[#FAFAF8] text-[#525252] hover:text-[#1E6BA3] transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => openDeleteModal(emp)} className="p-1.5 rounded-md hover:bg-[#FAFAF8] text-[#525252] hover:text-[#B91C1C] transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginatedEmployees.length === 0 && (
                <tr><td colSpan={11} className="py-16 text-center text-[#9C9C9C]">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-10 h-10 opacity-40" />
                    <p className="text-[16px] font-semibold text-[#1A1A1A]">No records found</p>
                    <p className="text-[13px] text-[#525252]">Try adjusting your filters</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E4E0] bg-white">
          <span className="text-[13px] text-[#525252]">Showing {Math.min((page - 1) * pageSize + 1, filteredEmployees.length)}-{Math.min(page * pageSize, filteredEmployees.length)} of {filteredEmployees.length} results</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5 && page > 3) p = page - 3 + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={cn("w-8 h-8 rounded-md text-[13px] font-medium transition-colors", p === page ? "bg-[#D4A017] text-white" : "text-[#525252] hover:bg-[#FAFAF8]")}>{p}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#525252]">Per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-[32px] w-[70px] border-[#E5E4E0] text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── New Employee Modal ───────────────────────────────────────────── */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[20px] font-semibold">Create New Employee Record</DialogTitle></DialogHeader>
          <EmployeeForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#D4A017] hover:bg-[#A67C0A] text-white" onClick={handleSaveNew}>Create Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Employee Modal ──────────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[20px] font-semibold">Edit Employee: {editingEmployee?.firstName} {editingEmployee?.lastName}</DialogTitle></DialogHeader>
          <EmployeeForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#D4A017] hover:bg-[#A67C0A] text-white" onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#B91C1C]">Delete Employee</DialogTitle>
            <DialogDescription className="text-[14px] text-[#525252]">
              Are you sure you want to delete <strong>{deletingEmployee?.firstName} {deletingEmployee?.lastName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#B91C1C] hover:bg-[#991B1B] text-white" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
