"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import styles from "./reset-password.module.css";

type FormErrors = Partial<Record<"password" | "confirmPassword" | "form", string>>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: FormErrors = {};
    if (!password) next.password = "Please enter a new password.";
    else if (password.length < 8) next.password = "Use 8+ characters.";
    if (confirmPassword !== password) next.confirmPassword = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!token) {
      setErrors({ form: "This reset link is missing its token. Please request a new one." });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <p className={styles.successText}>
        Your password has been reset. Redirecting you to log in...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.formLabel}>
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          className={`${styles.formInput}${errors.password ? ` ${styles.error}` : ""}`}
        />
        {errors.password && <p className={styles.errorText}>{errors.password}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword" className={styles.formLabel}>
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword)
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          className={`${styles.formInput}${errors.confirmPassword ? ` ${styles.error}` : ""}`}
        />
        {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
      </div>

      {errors.form && <p className={styles.errorText}>{errors.form}</p>}

      <button type="submit" disabled={submitting} className={styles.btnPrimary}>
        {submitting ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Reset your password</h1>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>

          <div className={styles.backLink}>
            <Link href="/login">Back to log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
