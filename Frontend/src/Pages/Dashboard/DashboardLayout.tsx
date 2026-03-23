import { Outlet } from "react-router-dom";
import Sidebar from "../../Components/layout/Sidebar";
import Topbar from "../../Components/layout/Topbar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-blue-100 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />
      

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar />
        
        
        {/* Page Content */}
        <main className="flex-1 p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}