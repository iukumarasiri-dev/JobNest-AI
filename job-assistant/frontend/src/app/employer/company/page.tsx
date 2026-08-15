"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Company = {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  website: string | null;
};

type FormState = {
  name: string;
  logoUrl: string;
  description: string;
  industry: string;
  size: string;
  website: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  logoUrl: "",
  description: "",
  industry: "",
  size: "",
  website: "",
};

function toFormState(company: Company): FormState {
  return {
    name: company.name,
    logoUrl: company.logoUrl ?? "",
    description: company.description ?? "",
    industry: company.industry ?? "",
    size: company.size ?? "",
    website: company.website ?? "",
  };
}

export default function CompanyProfilePage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setPageLoading(true);
    setLoadError("");
    try {
      const data: Company = await apiFetch("/api/company/me");
      setForm(toFormState(data));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load your company profile.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data: Company = await apiFetch("/api/company/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setForm(toFormState(data));
      setNotice("Company profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update your company profile.");
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
        <div className="border border-border rounded-lg p-4 animate-pulse space-y-3 max-w-lg">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-9 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
        <div className="border border-destructive/30 bg-destructive/10 text-destructive rounded p-4 text-sm">
          <p className="mb-2">{loadError}</p>
          <button onClick={load} className="underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Profile</h1>

      <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3 max-w-lg">
        {form.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.logoUrl}
            alt=""
            className="size-16 rounded object-cover border border-border"
          />
        )}

        <div>
          <label htmlFor="name" className="text-xs text-muted-foreground mb-1 block">
            Company name
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-border rounded p-2 bg-background text-sm"
          />
        </div>

        <div>
          <label htmlFor="logoUrl" className="text-xs text-muted-foreground mb-1 block">
            Logo URL
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            value={form.logoUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border border-border rounded p-2 bg-background text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="text-xs text-muted-foreground mb-1 block">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-border rounded p-2 bg-background text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="industry" className="text-xs text-muted-foreground mb-1 block">
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className="w-full border border-border rounded p-2 bg-background text-sm"
            />
          </div>

          <div>
            <label htmlFor="size" className="text-xs text-muted-foreground mb-1 block">
              Company size
            </label>
            <input
              id="size"
              name="size"
              value={form.size}
              onChange={handleChange}
              placeholder="e.g. 11-50 employees"
              className="w-full border border-border rounded p-2 bg-background text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="website" className="text-xs text-muted-foreground mb-1 block">
            Website
          </label>
          <input
            id="website"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border border-border rounded p-2 bg-background text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-primary">{notice}</p>}

        <button
          type="submit"
          disabled={saving}
          className="border border-border rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
