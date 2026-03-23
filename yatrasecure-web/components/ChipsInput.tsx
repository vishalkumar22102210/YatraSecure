import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface ChipsInputProps {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export default function ChipsInput({ label, placeholder = "Add tag...", tags = [], onChange, maxTags = 10 }: ChipsInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tagText: string) => {
    const formatTag = tagText.trim();
    if (!formatTag) return;
    if (tags.includes(formatTag)) {
      setInput("");
      return;
    }
    if (tags.length >= maxTags) return;

    onChange([...tags, formatTag]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
        {label} <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b", marginLeft: 8 }}>({tags.length}/{maxTags})</span>
      </label>
      
      <div 
        style={{
          minHeight: 46,
          background: "rgba(15,23,42,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "8px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          transition: "border-color 0.2s"
        }}
        className="focus-within:border-sky-500/50"
      >
        {tags.map((tag) => (
          <div 
            key={tag}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              background: "linear-gradient(90deg, rgba(56,189,248,0.1) 0%, rgba(56,189,248,0.05) 100%)",
              border: "1px solid rgba(56,189,248,0.2)",
              borderRadius: "99px",
              fontSize: 12,
              fontWeight: 600,
              color: "#38bdf8"
            }}
          >
            <span>{tag}</span>
            <button 
              onClick={() => removeTag(tag)}
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 2,
                borderRadius: "50%",
                color: "#38bdf8"
              }}
              className="hover:bg-sky-500/20 hover:text-white transition-colors"
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))}
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length >= maxTags ? "Max limit reached" : placeholder}
          disabled={tags.length >= maxTags}
          style={{
            flex: 1,
            minWidth: 120,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13,
            color: "white",
            padding: "4px 0"
          }}
          className="placeholder-slate-500"
        />
        
        {input.trim() && tags.length < maxTags && (
          <button
            onClick={() => addTag(input)}
            style={{
              background: "rgba(56,189,248,0.1)",
              border: "1px solid rgba(56,189,248,0.2)",
              borderRadius: 8,
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "#38bdf8",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer"
            }}
            className="hover:bg-sky-500/20 transition-colors"
          >
            Add <Plus style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>
      <p style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Press enter or comma to add a tag</p>
    </div>
  );
}
