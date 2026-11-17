import * as React from "react";

function Button({ className = "", ...props }) {
  return (
    <button
      data-slot="button"
      className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export { Button };
