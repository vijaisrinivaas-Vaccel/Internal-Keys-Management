import { useState } from "react";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../Components/ui/Dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { authFetch } from "../../lib/auth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId: string;
  environmentId: string;
}

export default function AddModuleDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  environmentId,
}: Props) {
  const [moduleName, setModuleName] = useState("");

  const handleCreate = async () => {
    if (!moduleName.trim()) return;

    const res = await authFetch("http://localhost:8000/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleName,
        projectId,
        environmentId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error(err);
      return;
    }

    setModuleName("");
    onSuccess();
    onOpenChange(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-5 rounded-xl">

        {/* REQUIRED FOR ACCESSIBILITY */}
        <VisuallyHidden>
          <DialogTitle>Create Module</DialogTitle>
          <DialogDescription>
            Create a new module inside this environment
          </DialogDescription>
        </VisuallyHidden>

        {/* Visible Title */}
        <h2 className="text-base font-semibold mb-3">
          Create Module
        </h2>

        <input
          type="text"
          placeholder="Module name"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
          className="border w-full px-3 py-2 rounded text-sm"
        />

        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Create
          </button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}