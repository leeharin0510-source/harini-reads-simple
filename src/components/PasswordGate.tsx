import { useState } from "react";
import { Lock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PASSWORD = "1234";
const STORAGE_KEY = "harin_unlocked";

interface Props {
  onUnlock: () => void;
}

export const PasswordGate = ({ onUnlock }: Props) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <form onSubmit={submit} className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary">
            <BookOpen className="w-7 h-7 text-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">하린이의 독서기록</h1>
          <p className="text-sm text-muted-foreground">암호를 입력해 주세요</p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="••••"
              className={`h-12 pl-10 text-base rounded-xl ${error ? "border-destructive animate-shake" : ""}`}
            />
          </div>
          {error && <p className="text-xs text-destructive text-center">암호가 일치하지 않습니다</p>}
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium">
            들어가기
          </Button>
        </div>
      </form>
    </div>
  );
};

export const isUnlocked = () => sessionStorage.getItem(STORAGE_KEY) === "1";
