import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Health & Training Disclaimer' }

export default function DisclaimerPage() {
  return (
    <>
      <h1>Health &amp; Training Disclaimer</h1>
      <p>Last updated: Draft — September 2026</p>

      <h2>FitCore is not medical advice</h2>
      <p>
        FitCore is a training tool. It is <strong>not</strong> medical advice and{' '}
        <strong>not</strong> a medical device. Nothing in the app — exercise substitutions, programme
        structure, readiness scores, or AI Coach output — diagnoses, treats, or prevents any injury or
        condition. FitCore is not a substitute for a physiotherapist, doctor, or qualified strength
        coach who can assess you in person.
      </p>

      <h2>Talk to a professional first</h2>
      <p>
        Consult a physiotherapist or doctor before starting a new training programme, and especially
        if you:
      </p>
      <ul>
        <li>have a current or past injury, or ongoing joint, tendon, or back pain;</li>
        <li>have a heart or cardiovascular condition, high blood pressure, or have been told to limit exertion;</li>
        <li>are pregnant, recently gave birth, or have pelvic floor concerns;</li>
        <li>take medication that affects heart rate, blood pressure, or balance;</li>
        <li>are returning to training after a long break, surgery, or illness.</li>
      </ul>

      <h2>What constraint-aware guidance can and cannot do</h2>
      <p>
        When you declare a constraint — for example patellar tendon pain, flat feet, a left/right
        imbalance, lower back or shoulder issues, wrist pain, or hypertension — FitCore adjusts
        exercise choices and suggestions using general training principles for that kind of
        constraint. It works only from what you tell it. It cannot examine you, know the cause or
        severity of your issue, or account for anything you have not declared. Two people with the
        same label can need very different programmes.
      </p>

      <h2>AI can be wrong</h2>
      <p>
        The AI Coach uses third-party language models. These can produce plans that are poorly suited
        to you, inconsistent, or simply incorrect, and they may sound confident when they are wrong.
        Review every suggestion before you act on it. If something looks off, skip it or check with a
        professional.
      </p>

      <h2>You make the final call</h2>
      <p>
        You decide what exercises you do, how much weight you lift, and how hard you push. Choose
        loads you can control with good form, progress gradually, and adapt or skip anything that does
        not feel right for your body on the day.
      </p>

      <h2>Stop immediately if something is wrong</h2>
      <p>Stop exercising and seek medical help if you experience:</p>
      <ul>
        <li>chest pain, pressure, or tightness;</li>
        <li>dizziness, light-headedness, or fainting;</li>
        <li>unusual shortness of breath or an irregular heartbeat;</li>
        <li>sharp, sudden, or worsening pain in a joint, tendon, or your back;</li>
        <li>numbness, tingling, or loss of strength;</li>
        <li>a severe headache, especially if you have high blood pressure.</li>
      </ul>
      <p>In an emergency, contact your local emergency services (112 in India) right away.</p>

      <h2>Use at your own risk</h2>
      <p>
        Strength training carries inherent risk of injury. By using FitCore you accept that risk and
        agree that you use the app and its suggestions at your own risk, as set out in our{' '}
        <Link href="/legal/terms">Terms of Service</Link>.
      </p>
    </>
  )
}
