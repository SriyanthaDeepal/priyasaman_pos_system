import { useState } from "react";
import type { RefObject } from "react";
import { BackspaceOutlined, Close, KeyboardOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import "./SinhalaTouchKeyboard.css";

type Props = {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

const consonants = [
  "ක","ඛ","ග","ඝ","ඞ","ඟ","ච","ඡ","ජ","ඣ","ඤ","ඥ",
  "ට","ඨ","ඩ","ඪ","ණ","ඬ","ත","ථ","ද","ධ","න","ඳ",
  "ප","ඵ","බ","භ","ම","ඹ","ය","ර","ල","ව","ශ","ෂ",
  "ස","හ","ළ","ෆ",
];
const vowels = ["අ","ආ","ඇ","ඈ","ඉ","ඊ","උ","ඌ","ඍ","ඎ","ඏ","ඐ","එ","ඒ","ඓ","ඔ","ඕ","ඖ"];
const forms = ["","ා","ැ","ෑ","ි","ී","ු","ූ","ෙ","ේ","ෛ","ො","ෝ","ෞ","ෘ","ෲ","ෟ","ෳ","්","ං","ඃ"];
const englishRows = ["qwertyuiop","asdfghjkl","zxcvbnm"];
const numberKeys = ["1","2","3","4","5","6","7","8","9","0",".","-","/","(",")",",",":"];

export default function SinhalaTouchKeyboard({ title, value, onChange, onClose, inputRef }: Props) {
  const [mode, setMode] = useState<"si" | "en" | "num">("si");
  const [selected, setSelected] = useState<string | null>(null);
  const [showVowels, setShowVowels] = useState(false);

  const getSelection = () => {
    const input = inputRef.current;
    return {
      start: input?.selectionStart ?? value.length,
      end: input?.selectionEnd ?? value.length,
    };
  };

  const restoreCursor = (position: number) => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.setSelectionRange(position, position);
    });
  };

  const insert = (character: string) => {
    const { start, end } = getSelection();
    onChange(value.slice(0, start) + character + value.slice(end));
    restoreCursor(start + character.length);
  };

  const backspace = () => {
    const { start, end } = getSelection();
    let from = start;
    if (start === end && start > 0) {
      const before = value.slice(0, start);
      // Segment by visible grapheme to avoid deleting only a Sinhala vowel sign.
      if (typeof Intl.Segmenter !== "undefined") {
        const segments = [...new Intl.Segmenter("si", { granularity: "grapheme" }).segment(before)];
        from = segments.at(-1)?.index ?? start - 1;
      } else {
        const clusters = before.match(/(?:[^\p{M}]\p{M}*)|(?:\p{M}+)/gu) ?? [];
        from = start - (clusters.at(-1)?.length ?? 1);
      }
    }
    onChange(value.slice(0, from) + value.slice(end));
    restoreCursor(from);
  };

  const key = (label: string, action: () => void, active = false) => (
    <button type="button" key={label} className={`stk-key${active ? " stk-key-active" : ""}`}
      onPointerDown={event => event.preventDefault()} onClick={action}>{label}</button>
  );

  return (
    <section className="stk-panel" aria-label="Sinhala touch keyboard">
      <Box className="stk-heading">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyboardOutlined color="success" />
          <Typography sx={{ fontWeight: 750 }}>{title}</Typography>
        </Box>
        <IconButton aria-label="Close keyboard" onClick={onClose}><Close /></IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Letters are inserted directly into the active POS field. Product results update as you type.
      </Typography>
      <Box className="stk-modes">
        <Button size="small" variant={mode === "si" ? "contained" : "outlined"} onClick={() => setMode("si")}>සිංහල</Button>
        <Button size="small" variant={mode === "en" ? "contained" : "outlined"} onClick={() => setMode("en")}>English</Button>
        <Button size="small" variant={mode === "num" ? "contained" : "outlined"} onClick={() => setMode("num")}>123</Button>
      </Box>
      {mode === "si" && (
        <>
          <Box className="stk-modes">
            <Button size="small" variant={!showVowels ? "contained" : "outlined"} onClick={() => setShowVowels(false)}>ව්‍යංජන</Button>
            <Button size="small" variant={showVowels ? "contained" : "outlined"} onClick={() => { setShowVowels(true); setSelected(null); }}>ස්වර</Button>
          </Box>
          {showVowels ? (
            <Box className="stk-grid">{vowels.map(v => key(v, () => insert(v)))}</Box>
          ) : (
            <>
              <Typography variant="caption">1. Select a consonant · 2. Tap the desired form</Typography>
              <Box className="stk-grid">{consonants.map(c => key(c, () => setSelected(c), selected === c))}</Box>
              {selected && (
                <Box className="stk-forms">
                  <Typography sx={{ fontWeight: 700 }}>{selected} — අකුරු ආකාර</Typography>
                  <Box className="stk-grid">{forms.map((form, index) => (
                    <button type="button" key={index} className="stk-key stk-form"
                      onPointerDown={event => event.preventDefault()} onClick={() => insert(selected + form)}>
                      {selected + form}
                    </button>
                  ))}</Box>
                </Box>
              )}
            </>
          )}
        </>
      )}
      {mode === "en" && (
        <Box className="stk-english">{englishRows.map(row => (
          <Box className="stk-grid" key={row}>{[...row].map(letter => key(letter, () => insert(letter)))}</Box>
        ))}</Box>
      )}
      {mode === "num" && <Box className="stk-grid">{numberKeys.map(k => key(k, () => insert(k)))}</Box>}
      <Box className="stk-controls">
        <Button variant="outlined" onPointerDown={event => event.preventDefault()} onClick={() => insert(" ")}>Space / හිස්තැන</Button>
        <Button variant="outlined" startIcon={<BackspaceOutlined />} onPointerDown={event => event.preventDefault()} onClick={backspace}>Delete</Button>
        <Button color="error" variant="outlined" onPointerDown={event => event.preventDefault()} onClick={() => { onChange(""); restoreCursor(0); }}>Clear</Button>
        <Button color="success" variant="contained" onClick={onClose}>Done / හරි</Button>
      </Box>
    </section>
  );
}
