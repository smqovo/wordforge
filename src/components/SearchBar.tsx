"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "搜索单词、释义、词组...",
}: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setValue(q);

      // Debounce: use a simple timeout
      const timer = setTimeout(() => {
        onSearch(q);
      }, 300);

      return () => clearTimeout(timer);
    },
    [onSearch]
  );

  return (
    <div className="relative">
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
}
