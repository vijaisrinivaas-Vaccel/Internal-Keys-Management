import { useState } from "react";

interface AccessToggleProps {
  enabled?: boolean;
  setEnabled?: (enabled: boolean) => void;
}

export default function AccessToggle({ enabled: propEnabled, setEnabled: propSetEnabled }: AccessToggleProps = {}) {
  const [localEnabled, setLocalEnabled] = useState(true);

  const isControlled = propEnabled !== undefined;
  const enabled = isControlled ? propEnabled : localEnabled;

  const handleToggle = () => {
    if (propSetEnabled) {
      propSetEnabled(!enabled);
    }
    if (!isControlled) {
      setLocalEnabled(!enabled);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      

      {/* Toggle */}
      <button
        onClick={handleToggle}
        className={`
          relative w-14 h-5 rounded-xl transition-all duration-300
          flex items-center p-1
          ${enabled ? "bg-green-500" : "bg-gray-300"}
        `}
      >
        {/* Icon inside track */}
        <span
          className={`
            text-white text-xs absolute left-2 transition-opacity duration-300
            ${enabled ? "opacity-100" : "opacity-0"}
          `}
        />
          
        

        {/* Knob */}
        <div
          className={`
            w-5 h-5 rounded-lg bg-white shadow-md
            transform transition-all duration-300
            ${enabled ? "translate-x-8" : "translate-x-0"}
          `}
        />

        {/* OFF text */}
        <span
          className={`
            text-gray-600 text-xs absolute right-2 transition-opacity duration-300
            ${!enabled ? "opacity-100" : "opacity-0"}
          `}
        >
          OFF
        </span>
      </button>

    </div>
  );
}