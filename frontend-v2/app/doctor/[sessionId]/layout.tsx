import DoctorShell from "@/components/doctor/DoctorShell";

export default function DoctorSessionLayout({ children }: { children: React.ReactNode }) {
  return <DoctorShell>{children}</DoctorShell>;
}
