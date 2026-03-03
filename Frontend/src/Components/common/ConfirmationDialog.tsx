import {
  Dialog as DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/Dialog";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;

  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  disabled?: boolean;
}

export default function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmation",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  disabled = false,
}: ConfirmationDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          h-60
          max-w-sm
          p-6
          rounded-2xl
          bg-white
          shadow-xl
          border border-slate-200
        "
      >
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

        <DialogHeader className="mt-2">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Message */}
        <p className="text-sm text-gray-600 mt-3 leading-relaxed tracking-tight">
          {message}
        </p>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          {/* Cancel */}
          <DialogClose asChild>
            <button
              className="
                px-4 py-2
                text-sm
                rounded-lg
                border border-slate-300
                text-gray-600
                hover:bg-gray-100
                transition
              "
            >
              {cancelText}
            </button>
          </DialogClose>

          {/* Confirm (Strong Danger Red) */}
          <button
            disabled={disabled}
            onClick={onConfirm}
            className="
              px-4 py-2
              text-sm
              rounded-lg
              font-medium
              bg-red-600
              text-white
              hover:bg-red-700
              active:scale-[0.98]
              transition
              shadow-sm
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}