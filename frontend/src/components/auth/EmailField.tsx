import TextField from "@/components/auth/TextField";

export default function EmailField({ error, onChange }: { error?: string; onChange: () => void }) {
  return (
    <TextField
      id="email"
      label="Email"
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      spellCheck={false}
      placeholder="name@example.com"
      error={error}
      onChange={onChange}
    />
  );
}
