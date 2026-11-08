import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Close, BackspaceOutlined, KeyboardOutlined } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import "./SinhalaTouchKeyboard.css";

type Props = {
  open: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
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

export default function SinhalaTouchKeyboard({ open, title, value, onChange, onClose }: Props) {
  const [mode, setMode] = useState<"si" | "en" | "num">("si");
  const [selected, setSelected] = useState<string | null>(null);
  const [showVowels, setShowVowels] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  const cursor = () => {
    const input = inputRef.current;
    return input ? { start: input.selectionStart ?? value.length, end: input.selectionEnd ?? value.length } :
      { start: caretRef.current ?? value.length, end: caretRef.current ?? value.length };
  };

  const insert = (character: string) => {
    const { start, end } = cursor();
    const next = value.slice(0, start) + character + value.slice(end);
    const position = start + character.length;
    caretRef.current = position;
    onChange(next);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
    });
  };

  const backspace = () => {
    const { start, end } = cursor();
    let from = start;
    if (start === end && start > 0) {
      // Delete a Sinhala base plus dependent vowel signs as one visible unit.
      const before = value.slice(0, start);
      const clusters = before.match(/(?:[^\p{M}]\p{M}*)|(?:\p{M}+)/gu) ?? [];
      from = start - (clusters.at(-1)?.length ?? 1);
    }
    const next = value.slice(0, from) + value.slice(end);
    caretRef.current = from;
    onChange(next);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(from, from);
    });
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    caretRef.current = event.target.selectionStart;
    onChange(event.target.value);
  };

  const key = (label: string, action: () => void, active = false) => (
    <button type="button" key={label} className={`stk-key${active ? " stk-key-active" : ""}`} onClick={action}>{label}</button>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: "95dvh" } } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 750 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <KeyboardOutlined color="success" /> {title}
        </Box>
        <IconButton aria-label="Close keyboard" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        <TextField inputRef={inputRef} fullWidth autoFocus label="Type or select letters" value={value}
          onChange={handleInput} onClick={() => { caretRef.current = inputRef.current?.selectionStart ?? value.length; }}
          onKeyUp={() => { caretRef.current = inputRef.current?.selectionStart ?? value.length; }}
          slotProps={{ htmlInput: { lang: mode === "si" ? "si" : "en", autoComplete: "off" } }} />
        <Box className="stk-modes">
          <Button variant={mode === "si" ? "contained" : "outlined"} onClick={() => setMode("si")}>සිංහල</Button>
          <Button variant={mode === "en" ? "contained" : "outlined"} onClick={() => setMode("en")}>English</Button>
          <Button variant={mode === "num" ? "contained" : "outlined"} onClick={() => setMode("num")}>123</Button>
        </Box>
        {mode === "si" && (
          <>
            <Box className="stk-modes">
              <Button variant={!showVowels ? "contained" : "outlined"} onClick={() => setShowVowels(false)}>ව්‍යංජන</Button>
              <Button variant={showVowels ? "contained" : "outlined"} onClick={() => { setShowVowels(true); setSelected(null); }}>ස්වර</Button>
            </Box>
            {showVowels ? (
              <Box className="stk-grid">{vowels.map(v => key(v, () => insert(v)))}</Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  1. Select a consonant · 2. Select its visible form to insert
                </Typography>
                <Box className="stk-grid">{consonants.map(c => key(c, () => setSelected(c), selected === c))}</Box>
                {selected && (
                  <Box className="stk-forms">
                    <Typography sx={{ fontWeight: 700 }}>{selected} — අකුරු ආකාර</Typography>
                    <Box className="stk-grid">{forms.map((form, index) => (
                      <button type="button" key={index} className="stk-key stk-form" onClick={() => insert(selected + form)}>
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
          <Button variant="outlined" onClick={() => insert(" ")}>Space / හිස්තැන</Button>
          <Button variant="outlined" startIcon={<BackspaceOutlined />} onClick={backspace}>Delete</Button>
          <Button color="error" variant="outlined" onClick={() => { caretRef.current = 0; onChange(""); }}>Clear</Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" color="success" onClick={onClose}>Done / හරි</Button>
      </DialogActions>
    </Dialog>
  );
}
