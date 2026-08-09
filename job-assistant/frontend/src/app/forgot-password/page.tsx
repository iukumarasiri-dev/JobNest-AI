"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.subtitle}>
            Enter the email address associated with your account and we&apos;ll send you a link
            to reset your password.
          </p>

          {submitted ? (
            <p className={styles.successText}>
              If that email is registered, we&apos;ve sent a reset link. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`${styles.formInput}${error ? ` ${styles.error}` : ""}`}
                />
                {error && <p className={styles.errorText}>{error}</p>}
              </div>

              <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <div className={styles.backLink}>
            <Link href="/login">Back to log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
