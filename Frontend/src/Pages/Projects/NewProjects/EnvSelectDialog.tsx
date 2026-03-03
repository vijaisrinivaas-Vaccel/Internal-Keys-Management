import { useState } from "react";
import { Dialog as DialogRoot, DialogContent } from "../../../Components/ui/Dialog";
import { authFetch } from "../../../lib/auth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: (env: any) => void;
}

export default function EnvSelectDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;

    const res = await authFetch("http://localhost:8000/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, projectId }),
    });

    if (res.ok) {
      const newEnv = await res.json();
      onSuccess(newEnv);
      setName("");
      onOpenChange(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Create Environment</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Environment Name"
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex justify-end gap-2 mt-4">
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