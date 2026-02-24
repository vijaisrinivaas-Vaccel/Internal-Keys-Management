import { SquarePen, Eye, Trash } from "lucide-react";
import type { ReactNode } from "react";

interface ButtonProps {
  onClick?: () => void;
  children?: ReactNode;
}

export function EditButton({ onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
    >
      <SquarePen size={16} />
    </button>
  );
}

export function ReadButton({ onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
    >
      <Eye size={16} />
    </button>
  );
}

export function Delbutton({ onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
    >
      <Trash size={16} />
    </button>
  );
}