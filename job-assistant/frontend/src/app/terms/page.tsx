import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted text-foreground">
      <main className="mx-auto flex max-w-3xl flex-col px-6 py-16">
        <div className="rounded-3xl border border-border bg-background p-10">
          <h1 className="text-3xl font-semibold">Terms of Use</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: August 13, 2026</p>

          <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="mb-2 text-base font-semibold">1. Acceptance of terms</h2>
              <p>
                By creating an account or using JobNest AI, you agree to be bound by these Terms
                of Use. If you do not agree to these terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">2. Using JobNest AI</h2>
              <p>
                JobNest AI helps you track job applications and generate AI-assisted content such
                as cover letters and resume bullets. You are responsible for the accuracy of the
                information you submit and for reviewing any AI-generated content before using it.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">3. Your account</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activity that occurs under your account. Notify us
                immediately if you suspect unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">4. Acceptable use</h2>
              <p>
                You agree not to misuse the service, including attempting to disrupt it, access
                accounts that are not yours, or use it for any unlawful purpose.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">5. Termination</h2>
              <p>
                We may suspend or terminate access to the service for violations of these terms.
                You may stop using the service and delete your account at any time.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">6. Changes to these terms</h2>
              <p>
                We may update these terms from time to time. Continued use of JobNest AI after
                changes take effect constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">7. Contact</h2>
              <p>
                Questions about these terms can be sent to our support team through the contact
                options available in the app.
              </p>
            </section>
          </div>

          <div className="mt-10 text-sm">
            <Link href="/login" className="text-foreground underline">
              Back to log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
