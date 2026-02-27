import { SquarePen, Eye, Trash } from "lucide-react";
import type { ReactNode } from "react";

interface ButtonProps {
  onClick?: () => void;
  children?: ReactNode;
}

export function EditButton({ onClick }: ButtonProps) {
  return (
    <div className="relative group inline-block">
  <button
    onClick={onClick}
    className="px-3 py-1 rounded hover:text-blue-500 transition-colors"
  >
    <SquarePen size={16} />
  </button>

  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                   whitespace-nowrap bg-black text-white text-xs 
                   px-2 py-1 rounded opacity-0 group-hover:opacity-100 
                   transition-opacity">
    Edit Project
  </span>
</div>
  );
}

export function ReadButton({ onClick }: ButtonProps) {
  return (
    <div className="relative group inline-block">
      <button
      onClick={onClick}
      className="px-3 py-1  hover:text-blue-500 transition-colors"
    >
      <Eye size={16} />
    </button>
    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                   whitespace-nowrap bg-black text-white text-xs 
                   px-2 py-1 rounded opacity-0 group-hover:opacity-100 
                   transition-opacity">
      View Project
  </span>
    </div>
  );
}

export function Delbutton({ onClick }: ButtonProps) {
  return (
    <div className="relative group inline-block">
      <button
        onClick={onClick}
        className="px-3 py-1 hover:text-red-600 transition-colors"
      >
        <Trash size={16} />
      </button>

      <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                       whitespace-nowrap bg-black text-white text-xs 
                       px-2 py-1 rounded opacity-0 
                       group-hover:opacity-100 transition-opacity">
        Delete
      </span>
    </div>
  );
}

export function Button({ onClick, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {children}
    </button>
  );
}