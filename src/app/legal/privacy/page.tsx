import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy' }

const CONTACT_PLACEHOLDER = '[contact email — to be added]'
const GRIEVANCE_OFFICER_PLACEHOLDER = '[name, email — to be added]'
const DATA_FIDUCIARY_PLACEHOLDER = '[legal name and address — to be added]'

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: Draft — September 2026</p>
      <p>
        This policy explains what personal data FitCore collects, why, who it is shared with, and the
        rights you have under India&apos;s Digital Personal Data Protection Act, 2023 (&quot;DPDP
        Act&quot;).
      </p>

      <h2>Who we are</h2>
      <p>
        FitCore is operated by an independent developer in India, who is the Data Fiduciary for your
        personal data: {DATA_FIDUCIARY_PLACEHOLDER}. Contact: {CONTACT_PLACEHOLDER}.
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Account email and password.</strong> To create your account and let you sign in.
          Passwords are handled by our authentication provider and stored only in hashed form.
        </li>
        <li>
          <strong>Training logs</strong> — sets, reps, weights, workouts, and readiness, mood, and
          wellness check-ins. To record your training, show progress, and tailor suggestions.
        </li>
        <li>
          <strong>Body metrics</strong> such as body weight. To track progress and calculate loads.
        </li>
        <li>
          <strong>Physical constraints you declare</strong> (for example tendon pain, flat feet, back
          or pelvic floor issues, hypertension). These may reveal health-related information. You
          provide them voluntarily and with your consent, and we use them only to adapt exercise
          selection and training suggestions. You can remove them at any time.
        </li>
        <li>
          <strong>AI Coach inputs</strong> — the goals, constraints, and preferences you enter to
          generate a plan, and the plan produced. To generate and show your plan.
        </li>
        <li>
          <strong>Anonymous usage fingerprint.</strong> If you use the AI Coach without an account, we
          store a one-way hash derived from your IP address and browser user-agent to enforce rate
          limits and prevent abuse. We do not store your raw IP address.
        </li>
        <li>
          <strong>Waitlist email.</strong> If you join the Pro waitlist, to tell you when Pro is
          available.
        </li>
        <li>
          <strong>Analytics and diagnostics.</strong> Aggregate page-view analytics (no cookies) and
          error reports, to keep the app working and understand which features are used.
        </li>
      </ul>

      <h2>Legal basis</h2>
      <p>
        We process your personal data on the basis of your consent, given when you sign up, declare
        constraints, use the AI Coach, or join the waitlist. Where the DPDP Act allows processing for
        certain legitimate uses under Section 7 — for example, to comply with law or respond to a
        legal request — we may rely on that instead. You can withdraw consent at any time; this does
        not affect processing already carried out, but some features will stop working without the
        data they need.
      </p>

      <h2>Who we share data with</h2>
      <p>We use a small number of service providers (Data Processors) who process data on our behalf:</p>
      <ul>
        <li><strong>Supabase</strong> — hosting, authentication, and database.</li>
        <li><strong>Vercel</strong> — app hosting and privacy-friendly, cookie-free analytics.</li>
        <li><strong>Sentry</strong> — error monitoring and diagnostics.</li>
        <li>
          <strong>AI model providers</strong> (Anthropic, and possibly Google or Groq) — receive only
          the content of your AI Coach request (goals, constraints, training context) to generate a
          plan. We do not send your email address.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we do not show ads or share data with
        advertisers. We may disclose data if required by law.
      </p>

      <h2>Cross-border transfers</h2>
      <p>
        Our service providers may store or process data on servers outside India. Such transfers are
        permitted under Section 16 of the DPDP Act, except to any country the Central Government
        restricts. We choose providers with appropriate security practices.
      </p>

      <h2>How long we keep data</h2>
      <ul>
        <li>Account data and training logs: while your account is active.</li>
        <li>
          After you request deletion: removed within 30 days, except where the law requires us to keep
          something longer.
        </li>
        <li>Anonymous AI Coach usage records: up to 90 days, for abuse prevention.</li>
        <li>Waitlist emails: until you unsubscribe or Pro launches and you have been notified.</li>
      </ul>

      <h2>Your rights</h2>
      <p>As a Data Principal under the DPDP Act, you have the right to:</p>
      <ul>
        <li>obtain a summary of the personal data we hold about you and how it is processed;</li>
        <li>correct, complete, update, or erase your personal data;</li>
        <li>withdraw your consent at any time;</li>
        <li>have your grievances addressed;</li>
        <li>nominate another person to exercise your rights in the event of your death or incapacity.</li>
      </ul>

      <h2>How to make a request</h2>
      <p>
        To access, correct, or delete your data, or withdraw consent, email {CONTACT_PLACEHOLDER} from
        the address linked to your account. In-app account deletion is planned. We will respond within
        a reasonable time.
      </p>

      <h2>Grievance Officer</h2>
      <p>
        If you have a complaint about how your data is handled, contact our Grievance Officer:{' '}
        {GRIEVANCE_OFFICER_PLACEHOLDER}. If you are not satisfied with our response, you may complain
        to the Data Protection Board of India.
      </p>

      <h2>Children</h2>
      <p>
        FitCore is not intended for anyone under 18. We do not knowingly process personal data of
        children. If you believe a child has created an account, contact us and we will delete it.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit (HTTPS), and our database uses row-level security so each account
        can access only its own records. No system is perfectly secure, but we take reasonable
        safeguards and will notify you and the Data Protection Board of a personal data breach as the
        law requires.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy. For material changes we will notify you in the app or by email
        before they take effect. See also our <Link href="/legal/terms">Terms of Service</Link>.
      </p>
    </>
  )
}
