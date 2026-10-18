import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service' }

const CONTACT_PLACEHOLDER = '[contact email — to be added]'

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>Last updated: Draft — September 2026</p>

      <h2>1. Acceptance</h2>
      <p>
        These Terms govern your use of FitCore, a strength training app operated by an independent
        developer based in India (&quot;FitCore&quot;, &quot;we&quot;, &quot;us&quot;). By creating
        an account or using any part of FitCore, including the AI Coach without an account, you agree
        to these Terms and to our <Link href="/legal/privacy">Privacy Policy</Link> and{' '}
        <Link href="/legal/disclaimer">Health &amp; Training Disclaimer</Link>. If you do not agree,
        please do not use FitCore.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use FitCore. By using it, you confirm that you are 18
        or older and legally able to enter into this agreement.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>Provide an email address you control and keep your password confidential.</li>
        <li>You are responsible for activity that happens under your account.</li>
        <li>Tell us promptly if you believe your account has been accessed without permission.</li>
        <li>One person per account. Accounts are not transferable.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, crawl, or bulk-extract content or data from FitCore by automated means.</li>
        <li>
          Circumvent or abuse usage limits, including the AI Coach rate limits (for example by
          rotating identities, devices, or networks to generate more plans than allowed).
        </li>
        <li>Reverse engineer, decompile, or attempt to access FitCore&apos;s source code or systems beyond what the app exposes to you.</li>
        <li>Interfere with, overload, or probe the security of the service.</li>
        <li>Use FitCore for anything unlawful, or submit content that is harmful or infringes others&apos; rights.</li>
        <li>Resell or commercially redistribute FitCore or its AI-generated output as a service.</li>
      </ul>

      <h2>5. Free and paid plans</h2>
      <p>
        The Free plan is available at no cost and currently includes workout logging (up to 7
        workouts) and one AI-generated training build. Limits may be adjusted over time.
      </p>
      <p>
        A Pro plan is planned (currently listed at ₹999 per year or ₹149 per month) but is{' '}
        <strong>not yet available for purchase</strong>. Joining the waitlist does not create any
        payment obligation. When Pro launches, its pricing, billing, renewal, and refund terms will be
        shown before you buy. We may change prices in future; any change will be communicated in
        advance and will not affect a period you have already paid for.
      </p>

      <h2>6. AI-generated content</h2>
      <p>
        The AI Coach produces training plans and suggestions using third-party AI models, based on
        the goals and constraints you provide. This output is general training guidance, not medical
        advice, diagnosis, or treatment. It can be incomplete or wrong. Review every suggestion and use
        your own judgement, and read the{' '}
        <Link href="/legal/disclaimer">Health &amp; Training Disclaimer</Link> before training.
      </p>

      <h2>7. Your content</h2>
      <p>
        You own the data you put into FitCore — your workout logs, body metrics, check-ins, and
        declared constraints. You grant us a limited, non-exclusive licence to store and process that
        data solely to operate and provide FitCore to you, including sending the relevant parts of
        your requests to our service providers as described in the Privacy Policy. We do not sell your
        data. The licence ends when your data is deleted, except for backups retained for a limited
        period or where the law requires us to keep it.
      </p>

      <h2>8. Termination and account deletion</h2>
      <p>
        You may stop using FitCore and request deletion of your account at any time by contacting us
        at {CONTACT_PLACEHOLDER}. We may suspend or terminate access if you breach these Terms, misuse
        the service, or if we are required to by law. Where reasonable, we will give notice and a
        chance to export your data first. If FitCore is discontinued, we will give reasonable advance
        notice.
      </p>

      <h2>9. Disclaimer of warranties</h2>
      <p>
        FitCore is provided &quot;as is&quot; and &quot;as available&quot;. To the extent permitted
        by law, we make no warranties that the service will be uninterrupted, error-free, or suitable
        for your particular goals or physical condition, or that any training outcome will be achieved.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted under Indian law, FitCore is not liable for any injury, loss,
        or damage arising from exercises you choose to perform, from reliance on AI-generated or
        in-app suggestions, or for indirect, incidental, or consequential losses (such as loss of data
        or profits). Where liability cannot be excluded, it is limited to the amount you paid us in
        the 12 months before the claim — which, while FitCore is free, is zero. Nothing in these Terms
        limits liability that cannot be limited by law.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Any dispute will be subject to the jurisdiction
        of the competent courts in India.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may update these Terms as FitCore evolves. For material changes we will notify you in the
        app or by email before they take effect. Continuing to use FitCore after that means you accept
        the updated Terms.
      </p>

      <h2>13. Contact</h2>
      <p>Questions about these Terms: {CONTACT_PLACEHOLDER}</p>
    </>
  )
}
