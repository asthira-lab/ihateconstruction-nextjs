"use client";

// Shared Create / Edit form for a Project. Client-generated idempotency key on mount for create mode.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { createProjectAction, patchProjectAction } from "@/app/projects/actions";
import type { Project } from "@/features/projects";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  initial?: Project;
}

interface FormState {
  name: string;
  clientName: string;
  currency: string;
  taxRegion: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  notes: string;
}

const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP", "AED"];
const COUNTRY_OPTIONS = ["IN", "US", "GB", "AE", "SG", "AU"];

function initialFormState(p?: Project): FormState {
  return {
    name: p?.name ?? "",
    clientName: p?.clientName ?? "",
    currency: p?.currency ?? "INR",
    taxRegion: p?.taxRegion ?? "IN",
    address: p?.location?.address ?? "",
    city: p?.location?.city ?? "",
    state: p?.location?.state ?? "",
    pincode: p?.location?.pincode ?? "",
    country: p?.location?.country ?? "IN",
    notes: p?.notes ?? "",
  };
}

function toCreatePayload(f: FormState): unknown {
  const location = trimLocation(f);
  return {
    name: f.name.trim(),
    clientName: f.clientName.trim() || null,
    currency: f.currency,
    taxRegion: f.taxRegion,
    location,
    notes: f.notes.trim() || null,
  };
}

function toPatchPayload(f: FormState, initial: Project): unknown {
  const patch: Record<string, unknown> = {};
  if (f.name.trim() !== initial.name) patch.name = f.name.trim();
  const nextClient = f.clientName.trim() || null;
  if (nextClient !== initial.clientName) patch.clientName = nextClient;
  const nextNotes = f.notes.trim() || null;
  if (nextNotes !== initial.notes) patch.notes = nextNotes;
  const nextLocation = trimLocation(f);
  if (JSON.stringify(nextLocation) !== JSON.stringify(initial.location)) patch.location = nextLocation;
  return patch;
}

function trimLocation(f: FormState) {
  const anyValue = f.address || f.city || f.state || f.pincode || f.country;
  if (!anyValue) return null;
  return {
    ...(f.address ? { address: f.address.trim() } : {}),
    ...(f.city ? { city: f.city.trim() } : {}),
    ...(f.state ? { state: f.state.trim() } : {}),
    ...(f.pincode ? { pincode: f.pincode.trim() } : {}),
    ...(f.country ? { country: f.country } : {}),
  };
}

export function ProjectForm({ mode, initial }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialFormState(initial));
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string[]> | null>(null);
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useRef<string>("");

  useEffect(() => {
    if (mode === "create" && !idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID();
    }
  }, [mode]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails(null);

    startTransition(async () => {
      if (mode === "create") {
        const res = await createProjectAction(toCreatePayload(state), idempotencyKey.current);
        if (!res.ok) {
          setError(res.error.message);
          if (res.error.details && typeof res.error.details === "object") {
            const d = res.error.details as { fieldErrors?: Record<string, string[]> };
            if (d.fieldErrors) setDetails(d.fieldErrors);
          }
          return;
        }
        router.push(`/projects/${res.data.id}`);
      } else if (initial) {
        const payload = toPatchPayload(state, initial);
        const res = await patchProjectAction(initial.id, payload);
        if (!res.ok) {
          setError(res.error.message);
          if (res.error.details && typeof res.error.details === "object") {
            const d = res.error.details as { fieldErrors?: Record<string, string[]> };
            if (d.fieldErrors) setDetails(d.fieldErrors);
          }
          return;
        }
        router.push(`/projects/${res.data.id}`);
        router.refresh();
      }
    });
  }

  const isCreate = mode === "create";

  return (
    <form onSubmit={submit} className="space-y-6">
      <Row label="Project name" required error={details?.name?.[0]}>
        <input
          type="text"
          required
          value={state.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </Row>

      <Row label="Client name" error={details?.clientName?.[0]}>
        <input
          type="text"
          value={state.clientName}
          onChange={(e) => set("clientName", e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </Row>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Currency" required>
          <select
            value={state.currency}
            onChange={(e) => set("currency", e.target.value)}
            disabled={!isCreate}
            className={inputClass}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!isCreate ? (
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
              Currency is fixed at creation. Create a new project to change it.
            </p>
          ) : null}
        </Row>
        <Row label="Tax region" required>
          <select
            value={state.taxRegion}
            onChange={(e) => set("taxRegion", e.target.value)}
            disabled={!isCreate}
            className={inputClass}
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!isCreate ? (
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
              Tax region is fixed at creation.
            </p>
          ) : null}
        </Row>
      </div>

      <fieldset className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <legend className="px-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
          Location (optional)
        </legend>
        <div className="space-y-4">
          <Row label="Address">
            <input
              type="text"
              value={state.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={500}
              className={inputClass}
            />
          </Row>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Row label="City">
              <input
                type="text"
                value={state.city}
                onChange={(e) => set("city", e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Row>
            <Row label="State">
              <input
                type="text"
                value={state.state}
                onChange={(e) => set("state", e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Row>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Row label="Pincode" error={details?.["location.pincode"]?.[0]}>
              <input
                type="text"
                value={state.pincode}
                onChange={(e) => set("pincode", e.target.value)}
                maxLength={20}
                className={inputClass}
              />
            </Row>
            <Row label="Country">
              <select
                value={state.country}
                onChange={(e) => set("country", e.target.value)}
                className={inputClass}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Row>
          </div>
        </div>
      </fieldset>

      <Row label="Notes" error={details?.notes?.[0]}>
        <textarea
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          maxLength={2000}
          rows={4}
          className={`${inputClass} resize-y`}
        />
      </Row>

      {error ? <FieldError message={error} /> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : isCreate ? "Create project" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white";

function Row({
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
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required ? <span className="ml-0.5 text-red-600" aria-hidden="true">*</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}
