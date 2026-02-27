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

  title?: string;         // Optional custom title
  message: string;        // Dynamic message
  confirmText?: string;   // Optional custom confirm button text
  cancelText?: string;    // Optional custom cancel text
  disabled?: boolean;
}

export default function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmation",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  disabled = false,
}: ConfirmationDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Dynamic Message */}
        <p className="text-sm text-gray-600 mt-2">
          {message}
        </p>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <button className="px-4 py-2 border rounded">
              {cancelText}
            </button>
          </DialogClose>

          <button
            disabled={disabled}
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}