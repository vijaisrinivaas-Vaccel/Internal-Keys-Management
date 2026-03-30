import { HardHat, Hammer, Wrench, Settings, ShieldAlert } from "lucide-react";

export default function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Icon Cluster */}
        <div className="relative inline-block">
          <div className="absolute -top-4 -left-4 animate-bounce delay-75">
            <Settings className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
          <div className="absolute -bottom-2 -right-6 animate-pulse">
            <Hammer className="w-10 h-10 text-orange-400 opacity-50" />
          </div>
          <div className="bg-white p-8 rounded-full shadow-2xl relative z-10 border-8 border-slate-100">
            <HardHat size={80} className="text-blue-600 animate-pulse" />
          </div>
          <div className="absolute top-0 right-0 animate-bounce delay-150">
            <Wrench className="w-6 h-6 text-purple-400 opacity-50" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-slate-800 tracking-tight">
            Under Maintenance
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto">
            We're currently performing some important system upgrades to improve your experience.
          </p>
        </div>

        {/* Alert Card */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 max-w-md mx-auto">
          <div className="flex items-start gap-4 text-left">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShieldAlert className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Restricted Access</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Management of keys and projects is temporarily paused. Only Superadmins have access during this period.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-200 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">
            Estimated completion: Soon™
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
