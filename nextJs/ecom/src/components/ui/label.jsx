import * as React from "react";

function Label({ className = "", ...props }) {
  return (
    <label
      data-slot="label"
      className={`flex items-center gap-2 text-sm font-medium ${className}`}
      {...props}
    />
  );
}

export { Label };
