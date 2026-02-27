import { useState } from "react";
import { Dialog as DialogRoot, DialogContent,DialogTitle,DialogDescription } from "../../Components/ui/Dialog";
import { authFetch } from "../../lib/auth";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddModuleDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [moduleName, setModuleName] = useState("");

  const handleCreate = async () => {
    if (!moduleName.trim()) return;

    const res = await authFetch("http://localhost:8000/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleName }),
    });

    if (res.ok) {
      setModuleName("");
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <VisuallyHidden>
        <DialogTitle>Create Module</DialogTitle>
        <DialogDescription>
          Create a new module for your project
        </DialogDescription>
      </VisuallyHidden>
      <DialogContent>
        <h2 className="text-lg font-semibold mb-4">Create Module</h2>

        <input
          type="text"
          placeholder="Enter module name"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
          className="border w-full px-3 py-2 rounded"
        />

        <div className="flex justify-end mt-4 gap-2">
          <button onClick={() => onOpenChange(false)}>Cancel</button>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}