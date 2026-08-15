"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, API_URL } from "@/lib/api";
import styles from "./login.module.css";

type LoginFormData = {
  identifier: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginFormData | "form", string>>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "google_auth_failed") {
      setErrors((prev) => ({
        ...prev,
        form: "Google sign-in didn't work. Please try again or log in with your email.",
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof LoginFormData;
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next: LoginErrors = {};
    if (!formData.identifier.trim()) next.identifier = "Please enter your email.";
    if (!formData.password) next.password = "Please enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: formData.identifier, password: formData.password }),
      });
      router.push(data.role === "EMPLOYER" ? "/employer/dashboard" : "/seeker/dashboard");
      router.refresh();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof LoginFormData) =>
    `${styles.formInput}${errors[field] ? ` ${styles.error}` : ""}`;

  return (
    <div className={styles.loginPage}>
      

      <div className={styles.loginMain}>
        <div className={styles.loginContent}>
          <h1 className={styles.loginTitle}>Log in</h1>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier" className={styles.formLabel}>Email address</label>
              <input
                id="identifier"
                name="identifier"
                type="email"
                value={formData.identifier}
                onChange={handleChange}
                className={inputClass("identifier")}
              />
              {errors.identifier && <p className={styles.errorText}>{errors.identifier}</p>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.formLabelRow}>
                <label htmlFor="password" className={styles.formLabel}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.togglePassword}
                >
                  
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={inputClass("password")}
              />
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe((prev) => !prev)}
              />
              Remember me
            </label>

            <p className={styles.termsText}>
              By continuing, you agree to the <a href="/terms">Terms of use</a> and{" "}
              <a href="/privacy">Privacy Policy.</a>
            </p>

            {errors.form && <p className={styles.errorText}>{errors.form}</p>}

            <button type="submit" disabled={submitting} className={styles.btnPrimary}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className={styles.forgotLink}>
            <a href="/forgot-password">Forget your password</a>
          </div>

          <div className={styles.signupPrompt}>
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </div>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>Or continue with</span>
            <div className={styles.dividerLine} />
          </div>

          <a href={`${API_URL}/api/auth/google`} className={styles.googleBtn}>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
