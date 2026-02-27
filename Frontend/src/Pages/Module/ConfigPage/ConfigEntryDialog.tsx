import { useState, useEffect } from "react";
import { Dialog as DialogRoot, DialogContent } from "../../../Components/ui/Dialog";
import { authFetch } from "../../../lib/auth";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  moduleId: string;
  projectId: string;
  editEntry?: any; // if exists → edit mode
}

export default function ConfigEntryDialog({
  open,
  onOpenChange,
  onSuccess,
  moduleId,
  projectId,
  editEntry,
}: Props) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [expireAt, setExpireAt] = useState("");
  const isEdit = !!editEntry;

  useEffect(() => {
    if (editEntry) {
      setKey(editEntry.key);
      setValue(editEntry.value);
      setExpireAt(editEntry.expireAt || "");
    } else {
      setKey("");
      setValue("");
      setExpireAt("");
    }
  }, [editEntry]);

  const handleSubmit = async () => {
    if (!key || !value) return;

    if (isEdit) {
      await authFetch(
        `http://localhost:8000/api/config/entry/${editEntry._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, expireAt }),
        }
      );
    } else {
      await authFetch("http://localhost:8000/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          moduleId,
          entries: [{ key, value, expireAt }],
        }),
      });
    }

    onSuccess();
    onOpenChange(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-5">
          {isEdit ? "Edit Config Entry" : "Add Config Entry"}
        </h2>

        {/* Key */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Key</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter key name"
          />
        </div>

        {/* Value */}
        <div className="mb-4">
          <label className="text-sm text-gray-600">Value</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter secret value"
          />
        </div>

        {/* Expiry */}
        <div className="mb-6">
          <label className="text-sm text-gray-600">Expire Date</label>
          <input
            type="date"
            value={expireAt}
            onChange={(e) => setExpireAt(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {isEdit ? "Update" : "Create"}
          </button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}