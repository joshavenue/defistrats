
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SITE_PASSWORD = "defi123";
const SESSION_STORAGE_KEY = "site_password_ok";

export const SitePasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entered, setEntered] = useState<boolean>(false);
  const [input, setInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Only show password gate in development/staging
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable.app');
    
    if (!isDevelopment) {
      setEntered(true);
      return;
    }
    
    // Check if password was already entered
    if (sessionStorage.getItem(SESSION_STORAGE_KEY) === "true") {
      setEntered(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      setEntered(true);
    } else {
      toast({
        title: "Incorrect Password",
        description: "Please try again.",
        variant: "destructive"
      });
      setInput("");
    }
  };

  if (entered) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0C0E12]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#181B20] border border-[#22262F] rounded-lg p-8 flex flex-col gap-4 min-w-[300px]"
        autoComplete="off"
      >
        <h2 className="font-bold text-xl text-[#F7F7F7] text-center">Staging Site Password</h2>
        <Input
          type="password"
          placeholder="Enter site password"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoFocus
          className="bg-[#23262F] text-[#F7F7F7] border-[#373A41]"
        />
        <Button type="submit" className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90">
          Enter
        </Button>
        <span className="text-xs text-[#aaa] text-center mt-2">
          Access restricted – for staging only
        </span>
      </form>
    </div>
  );
};
