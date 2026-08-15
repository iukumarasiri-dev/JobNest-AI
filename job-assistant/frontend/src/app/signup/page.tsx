"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import styles from "./signup.module.css";

type Role = "JOB_SEEKER" | "EMPLOYER";

type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  jobRole: string;
  location: string;
  birthDate: string;
};

type SignupErrors = Partial<Record<keyof SignupFormData | "general", string>>;

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("JOB_SEEKER");
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    jobRole: "",
    location: "",
    birthDate: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof SignupFormData;
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validate = () => {
    const next: SignupErrors = {};
    if (!formData.firstName.trim()) next.firstName = "Required";
    if (!formData.lastName.trim()) next.lastName = "Required";

    if (!formData.email.trim()) {
      next.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      next.password = "Required";
    } else if (formData.password.length < 8) {
      next.password = "Use 8+ characters";
    }

    if (!formData.confirmPassword) {
      next.confirmPassword = "Required";
    } else if (formData.confirmPassword !== formData.password) {
      next.confirmPassword = "Passwords don't match";
    }

    if (role === "EMPLOYER" && !formData.companyName.trim()) {
      next.companyName = "Required";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          role,
          jobRole: formData.jobRole.trim() || undefined,
          location: formData.location.trim() || undefined,
          birthDate: formData.birthDate || undefined,
          ...(role === "EMPLOYER" ? { companyName: formData.companyName.trim() } : {}),
        }),
      });
      router.push(role === "EMPLOYER" ? "/employer/dashboard" : "/seeker/dashboard");
      router.refresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: err instanceof Error ? err.message : "Unable to create your account right now.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = (field: keyof SignupFormData) =>
    `${styles.formInput}${errors[field] ? ` ${styles.error}` : ""}`;

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupMain}>
        <div className={styles.signupCard}>
          <div>
            <h1 className={styles.signupTitle}>Create an account</h1>
            <p className={styles.signupSubtitle}>
              Already have an account?{" "}
              <Link href="/login" className={styles.signupLink}>
                Log in
              </Link>
            </p>

            <form onSubmit={handleSubmit} className={styles.signupForm}>
              <div className={styles.roleToggle} role="radiogroup" aria-label="Account type">
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "JOB_SEEKER"}
                  onClick={() => setRole("JOB_SEEKER")}
                  className={`${styles.roleOption}${role === "JOB_SEEKER" ? ` ${styles.roleOptionActive}` : ""}`}
                >
                  I&apos;m a job seeker
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "EMPLOYER"}
                  onClick={() => setRole("EMPLOYER")}
                  className={`${styles.roleOption}${role === "EMPLOYER" ? ` ${styles.roleOptionActive}` : ""}`}
                >
                  I&apos;m hiring
                </button>
              </div>

              {role === "EMPLOYER" && (
                <div className={styles.formGroup}>
                  <label htmlFor="companyName" className={styles.formLabel}>
                    Company name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={inputClasses("companyName")}
                  />
                  {errors.companyName && <p className={styles.errorText}>{errors.companyName}</p>}
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.formLabel}>
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputClasses("firstName")}
                  />
                  {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.formLabel}>
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={inputClasses("lastName")}
                  />
                  {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="jobRole" className={styles.formLabel}>
                    Job role (optional)
                  </label>
                  <input
                    id="jobRole"
                    name="jobRole"
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={formData.jobRole}
                    onChange={handleChange}
                    className={inputClasses("jobRole")}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="location" className={styles.formLabel}>
                    Location (optional)
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="e.g. Colombo, Sri Lanka"
                    value={formData.location}
                    onChange={handleChange}
                    className={inputClasses("location")}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="birthDate" className={styles.formLabel}>
                  Birth date (optional)
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className={inputClasses("birthDate")}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClasses("email")}
                />
                {errors.email && <p className={styles.errorText}>{errors.email}</p>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.formLabel}>
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClasses("password")}
                  />
                  {errors.password && <p className={styles.errorText}>{errors.password}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.formLabel}>
                    Confirm your password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClasses("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className={styles.errorText}>{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <p className={styles.helperText}>
                Use 8 or more characters with a mix of letters, numbers &amp; symbols
              </p>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword((prev) => !prev)}
                />
                Show password
              </label>

              <div className={styles.formFooter}>
                <Link href="/login" className={styles.linkSecondary}>
                  log in instead
                </Link>
                <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                  {submitting ? "Creating..." : "Create an account"}
                </button>
              </div>
              {errors.general && <p className={styles.errorText}>{errors.general}</p>}
            </form>
          </div>

          <div className={styles.signupIllustration}>
            <img src="/images/signupimg.png" alt="" className={styles.signupImg} />
          </div>
        </div>
      </div>

      <footer className={styles.siteFooter}>
        <div className={styles.footerLang}>
          English (United States)
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className={styles.footerLinks}>
          <a href="/help">Help</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </footer>
    </div>
  );
}
