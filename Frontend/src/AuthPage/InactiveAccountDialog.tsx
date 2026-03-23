import { X, ShieldAlert, Mail, AlertCircle } from "lucide-react";

interface InactiveAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export default function InactiveAccountDialog({ 
  open, 
  onOpenChange, 
  email 
}: InactiveAccountDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with accent bar */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
          <div className="flex justify-between items-center p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <ShieldAlert size={24} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Account Inactive</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 mt-0.5" />
              <p className="text-red-800 text-sm">
                Your account has been deactivated by an administrator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
            <Mail size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-mono">{email}</span>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Please contact your system administrator to reactivate your account.
            </p>
            <p className="text-xs text-gray-500">
              If you believe this is an error, please reach out to the support team.
            </p>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="mt-6 w-full px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}