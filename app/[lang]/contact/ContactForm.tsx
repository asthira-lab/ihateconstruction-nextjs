"use client";

// ContactForm — client island. Takes its labels/errors as a prop so it's locale-aware.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { ContactActionResult } from "@/features/contact";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { submitContact } from "./actions";

type FormDict = Dictionary["contact"]["form"];

const SUBJECT_VALUES = ["general", "bug", "feature", "partnership"] as const;
type SubjectValue = (typeof SUBJECT_VALUES)[number];

const MESSAGE_MAX = 2000;

interface FormState {
  name: string;
  email: string;
  subject: SubjectValue;
  message: string;
  website: string; // honeypot
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  subject: "general",
  message: "",
  website: "",
};

// Loose email check — the server does the real one via zod.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(state: FormState, e: FormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const name = state.name.trim();
  if (name.length === 0) errors.name = e.nameRequired;
  else if (name.length < 2) errors.name = e.nameShort;
  else if (name.length > 80) errors.name = e.nameLong;

  const email = state.email.trim();
  if (email.length === 0) errors.email = e.emailRequired;
  else if (!EMAIL_RE.test(email)) errors.email = e.emailInvalid;

  const message = state.message.trim();
  if (message.length === 0) errors.message = e.messageRequired;
  else if (message.length < 10) errors.message = e.messageShort;
  else if (state.message.length > MESSAGE_MAX)
    errors.message = e.messageLong.replace("{max}", String(MESSAGE_MAX));

  return errors;
}

export function ContactForm({ dict }: { dict: FormDict }) {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Record<keyof FormErrors, boolean>>({
    name: false,
    email: false,
    message: false,
  });
  const [result, setResult] = useState<ContactActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, dict.errors), [state, dict.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const reset = () => {
    setState(INITIAL_STATE);
    setTouched({ name: false, email: false, message: false });
    setResult(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (hasErrors) return;
    startTransition(async () => {
      const res = await submitContact({
        name: state.name.trim(),
        email: state.email.trim(),
        subject: state.subject,
        message: state.message,
        website: state.website,
      });
      setResult(res);
    });
  };

  if (result?.ok) {
    return (
      <div
        role="status"
        className="space-y-4 rounded border border-green-600/40 bg-green-500/[.06] p-6 text-sm text-green-800 dark:border-green-400/40 dark:text-green-200"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-green-800/80 dark:text-green-200/80">
            {dict.successTitle}
          </p>
          <p className="mt-1 text-lg font-semibold">{dict.successBody}</p>
          <p className="mt-2 text-sm text-green-900/80 dark:text-green-100/80">
            {dict.successNote}
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={reset} type="button">
          {dict.sendAnother}
        </Button>
      </div>
    );
  }

  const errCode = result && !result.ok ? result.error.code : null;
  const errMsg = result && !result.ok ? result.error.message : null;

  const messageLen = state.message.length;
  const messageOver = messageLen > MESSAGE_MAX;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6" noValidate>
      {/* Honeypot — visually hidden, off the tab order, invisible to real users. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label>
          {dict.website}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={state.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      <LabeledRow label={dict.name} required error={touched.name ? errors.name : undefined}>
        <input
          type="text"
          value={state.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={touched.name && Boolean(errors.name)}
          className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
        />
      </LabeledRow>

      <LabeledRow label={dict.email} required error={touched.email ? errors.email : undefined}>
        <input
          type="email"
          value={state.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          autoComplete="email"
          required
          aria-invalid={touched.email && Boolean(errors.email)}
          className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
        />
      </LabeledRow>

      <LabeledRow label={dict.subject}>
        <select
          value={state.subject}
          onChange={(e) => set("subject", e.target.value as SubjectValue)}
          className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
        >
          {SUBJECT_VALUES.map((v) => (
            <option key={v} value={v}>
              {dict.subjects[v]}
            </option>
          ))}
        </select>
      </LabeledRow>

      <LabeledRow
        label={dict.message}
        required
        error={touched.message ? errors.message : undefined}
      >
        <div>
          <textarea
            value={state.message}
            onChange={(e) => set("message", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            required
            rows={6}
            aria-invalid={touched.message && Boolean(errors.message)}
            className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
          />
          <p
            className={`mt-1 text-right text-xs tabular-nums ${
              messageOver
                ? "text-red-600 dark:text-red-400"
                : "text-black/50 dark:text-white/50"
            }`}
            aria-live="polite"
          >
            {messageLen} / {MESSAGE_MAX}
          </p>
        </div>
      </LabeledRow>

      <div className="space-y-3">
        {errCode ? (
          <div
            role="alert"
            className="rounded border border-red-500/40 bg-red-500/[.06] px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <p className="font-semibold">{errCode.replaceAll("_", " ")}</p>
            <p>{errMsg}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending || hasErrors} size="md">
            {isPending ? dict.sending : dict.send}
          </Button>
          {hasErrors && (touched.name || touched.email || touched.message) ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {dict.errors.fixHighlighted}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

// ---- helpers ------------------------------------------------------------

function LabeledRow({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-start">
      <label className="pt-2 text-sm text-black/70 dark:text-white/70">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div>
        {children}
        {error ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
