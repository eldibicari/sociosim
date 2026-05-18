import { MimesisAppSidebar } from "@/app/components/MimesisAppSidebar";

export default function PersonnasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MimesisAppSidebar />
      <div style={{ paddingLeft: "var(--sidebar-offset, 0)" }} className="personnas-with-sidebar">
        {children}
      </div>
    </>
  );
}
