import type { FC } from "react";

interface IconProps { className?: string; size?: number; }

export const EmptyEmployeesIcon: FC<IconProps> = ({ className = "", size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="40" y="30" width="120" height="150" rx="8" stroke="#9C9C9C" strokeWidth="3" strokeDasharray="8 4" />
    <circle cx="100" cy="80" r="22" stroke="#9C9C9C" strokeWidth="3" fill="none" />
    <path d="M75 115 C75 100 125 100 125 115 L125 130 L75 130 Z" stroke="#9C9C9C" strokeWidth="3" fill="none" />
    <line x1="70" y1="50" x2="90" y2="50" stroke="#9C9C9C" strokeWidth="2" strokeLinecap="round" />
    <line x1="70" y1="150" x2="110" y2="150" stroke="#9C9C9C" strokeWidth="2" strokeLinecap="round" />
    <line x1="70" y1="162" x2="90" y2="162" stroke="#9C9C9C" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EmptyWorkflowsIcon: FC<IconProps> = ({ className = "", size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="35" y="25" width="130" height="160" rx="8" stroke="#9C9C9C" strokeWidth="3" strokeDasharray="8 4" />
    <circle cx="65" cy="65" r="10" stroke="#9C9C9C" strokeWidth="2.5" fill="none" />
    <path d="M85 62 L125 62" stroke="#9C9C9C" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M85 70 L110 70" stroke="#9C9C9C" strokeWidth="2" strokeLinecap="round" />
    <circle cx="65" cy="105" r="10" stroke="#9C9C9C" strokeWidth="2.5" fill="none" />
    <path d="M85 102 L125 102" stroke="#9C9C9C" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M85 110 L110 110" stroke="#9C9C9C" strokeWidth="2" strokeLinecap="round" />
    <circle cx="65" cy="145" r="10" stroke="#9C9C9C" strokeWidth="2.5" fill="none" />
    <path d="M85 142 L125 142" stroke="#9C9C9C" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M85 150 L110 150" stroke="#9C9C9C" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EmptyReportsIcon: FC<IconProps> = ({ className = "", size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="30" y="60" width="25" height="100" rx="3" stroke="#9C9C9C" strokeWidth="2.5" />
    <rect x="65" y="40" width="25" height="120" rx="3" stroke="#9C9C9C" strokeWidth="2.5" />
    <rect x="100" y="80" width="25" height="80" rx="3" stroke="#9C9C9C" strokeWidth="2.5" />
    <rect x="135" y="50" width="25" height="110" rx="3" stroke="#9C9C9C" strokeWidth="2.5" />
    <circle cx="155" cy="35" r="20" stroke="#9C9C9C" strokeWidth="2.5" fill="none" />
    <line x1="145" y1="45" x2="165" y2="25" stroke="#9C9C9C" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="147" cy="32" r="2" fill="#9C9C9C" />
  </svg>
);

export const EmptyAuditIcon: FC<IconProps> = ({ className = "", size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M100 30 L140 55 L140 150 Q140 160 130 160 L70 160 Q60 160 60 150 L60 55 Z" stroke="#9C9C9C" strokeWidth="3" strokeDasharray="8 4" fill="none" />
    <path d="M60 55 L100 55 L100 30" stroke="#9C9C9C" strokeWidth="3" strokeDasharray="8 4" fill="none" />
    <path d="M85 90 L115 90 M85 105 L115 105 M85 120 L105 120" stroke="#9C9C9C" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M100 30 L140 55 L100 55 Z" stroke="#9C9C9C" strokeWidth="2.5" fill="none" />
  </svg>
);

export const AvatarPlaceholder: FC<IconProps> = ({ className = "", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="24" fill="#D4A017" />
    <circle cx="24" cy="19" r="8" fill="white" fillOpacity="0.9" />
    <path d="M12 38 C12 30 18 26 24 26 C30 26 36 30 36 38" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
