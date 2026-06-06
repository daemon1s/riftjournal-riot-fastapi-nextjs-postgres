import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Search } from "lucide-react";

interface MultiSelectComboboxProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectCombobox({
  availableTags,
  selectedTags,
  onChange,
  placeholder = "Buscar o crear etiqueta..."
}: MultiSelectComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(query.toLowerCase()) &&
      !selectedTags.includes(tag)
  );

  const showCreateOption =
    query.trim().length > 0 &&
    !availableTags.some((tag) => tag.toLowerCase() === query.trim().toLowerCase()) &&
    !selectedTags.some((tag) => tag.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (tag: string) => {
    onChange([...selectedTags, tag]);
    setQuery("");
  };

  const handleCreate = () => {
    const newTag = query.trim();
    if (newTag) {
      onChange([...selectedTags, newTag]);
      setQuery("");
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-accent-blue/10 border border-accent-blue/40 text-accent-blue rounded-full shadow-[0_0_10px_rgba(83,131,232,0.1)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="text-accent-blue hover:text-white focus:outline-none transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-text/80">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-[rgba(55,58,85,0.3)] rounded-xl text-sm text-foreground placeholder-muted-text focus:outline-none focus:border-accent-blue transition-all"
        />
      </div>

      {isOpen && (query.trim() || filteredTags.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-[#030611]/98 border border-[rgba(55,58,85,0.45)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
          {filteredTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelect(tag)}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-zinc-800/40 hover:text-accent-blue transition-colors font-mono"
            >
              {tag}
            </button>
          ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full px-4 py-2.5 text-left text-sm text-accent-blue bg-accent-blue/5 hover:bg-accent-blue/10 transition-colors font-mono flex items-center gap-2 border-t border-[rgba(55,58,85,0.2)]"
            >
              <Plus size={14} />
              Crear etiqueta "{query.trim()}"
            </button>
          )}

          {filteredTags.length === 0 && !showCreateOption && (
            <div className="px-4 py-3 text-sm text-muted-text text-center">
              No se encontraron etiquetas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
