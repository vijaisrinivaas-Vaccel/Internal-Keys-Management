import {
  Dialog as DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../Components/ui/Dialog";

interface ImportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplace: () => void;
  onAppend: () => void;
  onCancel: () => void;
}

export default function ImportOptionsDialog({
  open,
  onOpenChange,
  onReplace,
  onAppend,
  onCancel,
}: ImportOptionsDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 rounded-2xl bg-white shadow-xl border border-slate-200 h-60">
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

        <DialogHeader className="mt-2">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Import Options
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-2 leading-relaxed">
            How would you like to import this file?
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onAppend}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Append
          </button>
          <button
            onClick={onReplace}
            className="flex-1 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Replace
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-3 w-full px-4 py-2 text-sm border border-slate-300 text-gray-600 rounded-lg hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </DialogContent>
    </DialogRoot>
  );
}