import { RepoProvider } from "../../context/Repocontext";

export default function DashboardLayout({ children }) {
  return (
    <RepoProvider>
      {children}
    </RepoProvider>
  );
}
