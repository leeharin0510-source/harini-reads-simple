import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import sunImg from "@/assets/doodle-sun.png";
import cloudImg from "@/assets/doodle-cloud.png";
import flowerImg from "@/assets/doodle-flower.png";
import sproutImg from "@/assets/doodle-sprout.png";
import heartImg from "@/assets/doodle-heart.png";

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
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* 배경 doodles */}
      <img src={sunImg} alt="" aria-hidden className="absolute top-8 right-6 w-24 h-24 animate-wiggle" />
      <img src={cloudImg} alt="" aria-hidden className="absolute top-20 left-4 w-20 h-16 animate-float opacity-90" />
      <img src={cloudImg} alt="" aria-hidden className="absolute bottom-32 right-10 w-16 h-12 animate-float opacity-70" style={{ animationDelay: "1s" }} />
      <img src={sproutImg} alt="" aria-hidden className="absolute bottom-10 left-6 w-20 h-20" />
      <img src={flowerImg} alt="" aria-hidden className="absolute bottom-8 right-8 w-16 h-16" />
      <img src={heartImg} alt="" aria-hidden className="absolute top-40 right-16 w-10 h-10 animate-float" style={{ animationDelay: "0.5s" }} />

      <form onSubmit={submit} className="w-full max-w-sm space-y-7 relative z-10">
        <div className="text-center space-y-2">
          <p className="font-handwrite text-xl text-primary">welcome ✿</p>
          <h1 className="font-handwrite text-5xl text-foreground leading-tight">
            하린이의<br/>독서기록
          </h1>
          <p className="font-doodle text-base text-muted-foreground pt-2">암호를 입력해 주세요</p>
        </div>

        <div className="doodle-card p-5 space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="••••"
            className={`h-12 rounded-2xl border-2 font-doodle text-center text-lg tracking-widest ${error ? "border-destructive animate-shake" : ""}`}
          />
          {error && <p className="font-doodle text-sm text-destructive text-center">암호가 일치하지 않아요!</p>}
          <Button type="submit" className="w-full h-12 rounded-2xl font-doodle text-lg">
            들어가기 →
          </Button>
        </div>
      </form>
    </div>
  );
};

export const isUnlocked = () => sessionStorage.getItem(STORAGE_KEY) === "1";
