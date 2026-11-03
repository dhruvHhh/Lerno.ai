import { Link } from "react-router";

import LegalPage, { CONTACT } from "@/components/layout/LegalPage";

const MAIL = <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

const SECTIONS = [
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: (
      <p>
        These terms are an agreement between you and Suryansh Pratap Singh, who runs Lerno (math.lerno.dev) from India.
        By creating an account or using Lerno, you agree to them and to our <Link to="/privacy">privacy policy</Link>.
        If you don&apos;t agree, please don&apos;t use Lerno.
      </p>
    ),
  },
  {
    id: "who-can-use",
    title: "Who can use Lerno",
    body: (
      <p>
        Lerno is made for students. If you are under 18, you may use it only with the permission of a parent or
        guardian, who agrees to these terms for you and is responsible for your use of Lerno.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>Give a real email address, and keep your password secret.</li>
        <li>One account per person. Don&apos;t share it, sell it, or use someone else&apos;s.</li>
        <li>
          You are responsible for what happens in your account. Tell us at once if you think someone else used it.
        </li>
      </ul>
    ),
  },
  {
    id: "the-service",
    title: "What Lerno does",
    body: (
      <>
        <p>
          Lerno uses AI to turn a maths question into a short animated lesson with narration, a quiz, a tutor you can
          ask, and notes. Lerno is for maths: it may turn away topics that aren&apos;t maths and suggest a maths topic
          instead.
        </p>
        <p>
          Lerno is free for now, with daily limits on lessons, voices and tutor questions. We may change these limits,
          add paid plans, or change, pause or stop parts of Lerno. If we add paid plans, we will tell you first, and
          nothing you use will start costing money without your agreement.
        </p>
      </>
    ),
  },
  {
    id: "ai-content",
    title: "Lessons are made by AI",
    body: (
      <>
        <p>
          <b>Lessons, narration, quizzes and tutor answers are made by AI and can contain mistakes.</b> They may explain
          something wrongly, show a wrong number, or leave out an important step. Check important results yourself, and
          ask a teacher when something is unclear.
        </p>
        <p>
          Lerno helps you learn; it doesn&apos;t replace your teacher, textbook or school. Don&apos;t rely on it alone
          for exams, grades or decisions that matter.
        </p>
      </>
    ),
  },
  {
    id: "fair-use",
    title: "Using Lerno fairly",
    body: (
      <>
        <p>Please don&apos;t:</p>
        <ul>
          <li>use Lerno to make content that is unlawful, hateful, sexual, violent or harmful;</li>
          <li>try to trick the AI into ignoring its rules, or into making something other than maths lessons;</li>
          <li>get around the daily limits, for example with many accounts or automated requests;</li>
          <li>copy Lerno in bulk with bots, or try to break, overload or reverse engineer the service;</li>
          <li>use Lerno in a way that breaks the law or harms other people.</li>
        </ul>
        <p>If you do, we may remove content, limit your use, or close your account.</p>
      </>
    ),
  },
  {
    id: "ownership",
    title: "Who owns what",
    body: (
      <>
        <p>
          <b>Your topics, questions and notes are yours.</b> You give us permission to store and process them, and to
          send them to the providers in our privacy policy, only to run Lerno for you.
        </p>
        <p>
          You may use the lessons made for you for your own learning and for teaching, such as sharing them with a
          class. Don&apos;t sell them or present them as a Lerno product. Because lessons are made by AI, others may
          receive similar lessons.
        </p>
        <p>
          The Lerno name, logo, website design and software belong to Suryansh Pratap Singh. These terms don&apos;t give
          you any right to them.
        </p>
      </>
    ),
  },
  {
    id: "ending",
    title: "Closing your account",
    body: (
      <p>
        You can stop using Lerno at any time. To delete your account and data, email {MAIL}. We may suspend or close an
        account that breaks these terms, or if the law requires it. Where it is fair and safe, we will tell you why.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility",
    body: (
      <>
        <p>
          Lerno is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We work hard to keep it accurate and
          running, but we can&apos;t promise it will always be correct, available or free of errors.
        </p>
        <p>
          As far as the law allows, we are not responsible for indirect losses, such as lost marks, opportunities or
          data, that come from using Lerno or from mistakes in its lessons. Since Lerno is free, our total
          responsibility to you is limited to ₹1,000. Nothing in these terms removes rights that the law gives you and
          that can&apos;t be removed by agreement.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. If there is a problem, please email us first; most issues can be
        solved quickly. If we can&apos;t solve it together, the courts of India will decide.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms as Lerno grows. We will change the date at the top, and tell you by email or in the
        app before an important change applies. If you keep using Lerno after that, you accept the new terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions about these terms? Email {MAIL}.</p>,
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of service"
      intro={
        <p>
          These terms explain the rules for using Lerno, in plain words. The most important part: lessons are made by AI
          and can contain mistakes, so check what matters.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
