"use client";

import { ArrowLeft, Check, ImagePlus, Sparkles, X } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { cardThemes, categories, type CardCategory, type CardDraft, type CardTheme } from "./types";

interface ComposerProps {
  onClose: () => void;
  onReady: (draft: CardDraft) => void;
}

interface ComposerForm {
  name: string;
  category: CardCategory;
  line: string;
  area: string;
  price: string;
  theme: CardTheme;
}

const initialForm: ComposerForm = {
  name: "",
  category: "Services",
  line: "",
  area: "Williamsburg",
  price: "",
  theme: "yellow",
};

export function Composer({ onClose, onReady }: ComposerProps) {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const onImages = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).slice(0, 2);
    previews.forEach(URL.revokeObjectURL);
    setFiles(nextFiles);
    setPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    onReady({ ...form, price: form.price || undefined, files, previews });
  };

  return (
    <div className="composer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="composer" onSubmit={submit}>
        <header>
          <button type="button" className="icon-btn" onClick={step === 2 ? () => setStep(1) : onClose} aria-label={step === 2 ? "Back" : "Close"}>{step === 2 ? <ArrowLeft /> : <X />}</button>
          <div><span>POST A CARD</span><small>STEP {step} OF 2</small></div>
          <span className="step-count">0{step}</span>
        </header>
        {step === 1 ? (
          <div className="composer-body">
            <label>Business or service<input required autoFocus value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="What should the wall call you?" /></label>
            <div className="form-grid">
              <label>Category<select value={form.category} onChange={(event) => setForm((value) => ({ ...value, category: event.target.value as CardCategory }))}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Neighborhood<input required value={form.area} onChange={(event) => setForm((value) => ({ ...value, area: event.target.value }))} /></label>
            </div>
            <label>What do you offer?<textarea required maxLength={90} value={form.line} onChange={(event) => setForm((value) => ({ ...value, line: event.target.value }))} placeholder="Keep it short. Walls are busy." /></label>
            <label>Price <span>(optional)</span><input value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} placeholder="$25 / visit" /></label>
          </div>
        ) : (
          <div className="composer-body design-step">
            <label className="upload-zone">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImages} />
              {previews.length ? <div className="preview-row">{previews.map((src) => <img src={src} key={src} alt="Upload preview" />)}</div> : <><ImagePlus /><strong>Add 1 or 2 pictures</strong><span>JPG, PNG or WEBP · 8MB each</span></>}
            </label>
            <fieldset><legend>Paper</legend><div className="swatches">{cardThemes.filter((theme) => theme !== "cream").map((theme) => <button type="button" key={theme} className={`swatch ${theme} ${form.theme === theme ? "selected" : ""}`} onClick={() => setForm((value) => ({ ...value, theme }))} aria-label={`${theme} paper`}>{form.theme === theme ? <Check /> : null}</button>)}</div></fieldset>
            <div className={`mini-preview theme-${form.theme}`}><span>{form.category}</span><strong>{form.name || "Your business"}</strong><p>{form.line || "Your offer goes here."}</p></div>
          </div>
        )}
        <footer><span>You’ll choose its spot next.</span><button className="primary" type="submit">{step === 1 ? "Design card" : "Choose a spot"} <Sparkles /></button></footer>
      </form>
    </div>
  );
}
