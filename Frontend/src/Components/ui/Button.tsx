import { SquarePen, Eye, Trash } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function EditButton({ onClick }: { onClick?: () => void }) {
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

export function ReadButton({ onClick }: { onClick?: () => void }) {
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

export function Delbutton({ onClick }: { onClick?: () => void }) {
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

export function Button({ 
  onClick, 
  children, 
  className,
  variant = "primary",
  disabled = false,
  ...props 
}: ButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-300 hover:bg-gray-400 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-800",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className || `px-4 py-2 rounded-lg transition-colors font-semibold ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;