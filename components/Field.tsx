import type { InputHTMLAttributes } from "react";

type Props = { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, name, ...rest }: Props) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input id={name} name={name} className="field" {...rest} />
    </div>
  );
}