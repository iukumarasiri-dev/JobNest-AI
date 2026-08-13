import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted text-foreground">
      <main className="mx-auto flex max-w-3xl flex-col px-6 py-16">
        <div className="rounded-3xl border border-border bg-background p-10">
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: August 13, 2026</p>

          <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground">
            <section>
              <h2 className="mb-2 text-base font-semibold">1. Information we collect</h2>
              <p>
                We collect information you provide directly, such as your name, email address,
                and the job application details you add to JobNest AI, along with information
                generated as you use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">2. How we use your information</h2>
              <p>
                We use your information to operate and improve JobNest AI, including tracking
                your applications, generating AI-assisted content, and communicating with you
                about your account.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">3. AI-generated content</h2>
              <p>
                Details you provide about jobs and your background may be used to generate
                content such as cover letters. This content is generated to assist you and should
                be reviewed before use.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">4. Sharing of information</h2>
              <p>
                We do not sell your personal information. We may share information with service
                providers who help us operate JobNest AI, subject to appropriate confidentiality
                obligations.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">5. Data security</h2>
              <p>
                We take reasonable measures to protect your information, including encrypting
                passwords and restricting access to your data.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">6. Your choices</h2>
              <p>
                You can update your account details at any time from your profile settings, and
                you may request deletion of your account and associated data.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">7. Changes to this policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of
                significant changes through the app or by email.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold">8. Contact</h2>
              <p>
                Questions about this policy can be sent to our support team through the contact
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
