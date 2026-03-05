import { useState, useRef, useEffect } from "react";
import { MoreVertical, Check, ChevronDown } from "lucide-react";
import { authFetch } from "../../../lib/auth";

interface Environment {
  _id: string;
  name: string;
}

interface Props {
  environments: Environment[];
  selectedEnvironment: string;
  setSelectedEnvironment: (id: string) => void;
  refresh: () => void;
  projectId: string;
}

export default function EnvironmentSelect({
  environments,
  selectedEnvironment,
  setSelectedEnvironment,
  refresh,
  projectId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [value, setValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setMenuOpenId(null);
        setRenamingId(null);
        setCreating(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= CREATE ================= */
  const handleCreate = async () => {
    if (!value.trim()) return;

    const res = await authFetch(
      "http://localhost:8000/api/environments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value, projectId }),
      }
    );

    if (res.ok) {
      const newEnv = await res.json();
      setSelectedEnvironment(newEnv._id);
      setValue("");
      setCreating(false);
      refresh();
    }
  };

  /* ================= RENAME ================= */
  const handleRename = async (id: string) => {
    if (!value.trim()) return;

    await authFetch(
      `http://localhost:8000/api/environments/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      }
    );

    setRenamingId(null);
    setValue("");
    refresh();
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    await authFetch(
      `http://localhost:8000/api/environments/${id}`,
      { method: "DELETE" }
    );

    setMenuOpenId(null);
    refresh();
  };

  const selectedEnvName =
    environments.find((e) => e._id === selectedEnvironment)?.name ||
    "Select";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center border rounded-xl px-4 py-2 bg-white shadow-sm hover:border-blue-400 transition"
      >
        <span>{selectedEnvName}</span>
        <ChevronDown size={16} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50">

          {/* ENV LIST */}
          {environments.map((env) => (
            <div
              key={env._id}
              className="flex justify-between items-center px-3 py-2 hover:bg-gray-100 transition"
            >
              {renamingId === env._id ? (
                <div className="flex gap-2 w-full">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="border px-2 py-1 rounded w-full text-sm"
                  />
                  <button
                    onClick={() => handleRename(env._id)}
                    className="text-blue-600 text-sm"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedEnvironment(env._id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      size={14}
                      className={`text-blue-600 ${
                        selectedEnvironment === env._id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    <span>{env.name}</span>
                  </div>

                  {/* 3 dots */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(
                          menuOpenId === env._id ? null : env._id
                        );
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpenId === env._id && (
                      <div className="absolute right-0 mt-2 w-28 bg-white border rounded-lg shadow-md z-50">
                        <button
                          onClick={() => {
                            setRenamingId(env._id);
                            setValue(env.name);
                            setMenuOpenId(null);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          Rename
                        </button>

                        <button
                          onClick={() => handleDelete(env._id)}
                          className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* INLINE CREATE SECTION */}
          <div className="border-t border-slate-300 mt-1">

            {creating && (
              <div className="flex gap-2 px-3 py-2">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Environment name"
                  className="border px-2 py-1 rounded w-full text-sm"
                />
                <button
                  onClick={handleCreate}
                  className="text-blue-600 text-sm"
                >
                  Save
                </button>
              </div>
            )}

            {!creating && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  setCreating(true);
                  setValue("");
                }}
              >
                + Create New
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}