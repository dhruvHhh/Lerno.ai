import LegalPage, { CONTACT } from "@/components/layout/LegalPage";

const MAIL = <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

const SECTIONS = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        Lerno (math.lerno.dev) is run by Suryansh Pratap Singh, an individual based in India. He decides how your
        personal data is used and is responsible for it. For any question about your data, or to use your rights, email{" "}
        {MAIL}. This address also reaches the person who handles complaints.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li>
            <b>Account details:</b> your name, email address and password. Passwords are stored only in hashed form, so
            we can't read them. If you sign in with Google, we receive your name, email address and profile picture from
            Google.
          </li>
          <li>
            <b>What you create:</b> the topics you ask about, the lessons made for you (videos, narration, quiz
            questions), the questions you ask the tutor and its answers, your notes, and the narration languages you
            pick.
          </li>
          <li>
            <b>Technical data:</b> our servers keep short logs of requests, such as the time, errors, and topics we
            turned away because they were not maths. We use these to fix problems and improve Lerno.
          </li>
          <li>
            <b>Visit counts:</b> Vercel Web Analytics counts visits to our pages. It records the page, the site you came
            from, your approximate location, and your type of device, operating system and browser. It isn&apos;t linked
            to your account, and lesson links are counted without the lesson&apos;s ID. The way it tells visitors apart
            is discarded after 24 hours.
          </li>
          <li>
            <b>On your device only:</b> your browser keeps your settings and progress, such as where you stopped a
            video, your quiz answers and your chosen level. This stays in your browser and is not sent to us.
          </li>
        </ul>
        <p>We don't collect payment details, your location, or contacts, and we don't ask for sensitive data.</p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use it",
    body: (
      <ul>
        <li>To create your account, sign you in, and keep your account secure.</li>
        <li>To make lessons, voices in other languages, and tutor answers for the topics you ask about.</li>
        <li>To save your lessons and notes so you can come back to them.</li>
        <li>To apply fair daily limits and stop misuse.</li>
        <li>To send emails you need, such as confirming your email or resetting your password.</li>
        <li>To find and fix problems.</li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    title: "Why we may use it",
    body: (
      <p>
        We use your data because you asked for the service by creating an account (to provide it to you), because you
        agreed when you signed up, and, for security and fixing problems, because we have a legitimate need to keep
        Lerno working and safe. You can withdraw your agreement at any time by deleting your account, as section 8
        explains.
      </p>
    ),
  },
  {
    id: "who-we-share-with",
    title: "Who helps us run Lerno",
    body: (
      <>
        <p>
          We don't sell your data and we don't show ads. We share it only with these companies, which process it for us
          to run Lerno:
        </p>
        <ul>
          <li>
            <b>Supabase:</b> accounts, sign-in and the database.
          </li>
          <li>
            <b>Modal:</b> the servers that make lessons and voices.
          </li>
          <li>
            <b>Vercel:</b> hosts the website and counts visits.
          </li>
          <li>
            <b>Anthropic (Claude):</b> the AI that writes lessons, checks that a topic is maths, translates narration,
            and answers tutor questions. It receives your topics and tutor questions. Under its commercial terms,
            Anthropic doesn't use this data to train its models.
          </li>
          <li>
            <b>Murf:</b> turns the lesson narration into speech. It receives the narration text, not your account
            details.
          </li>
          <li>
            <b>Google:</b> only if you choose to sign in with Google.
          </li>
        </ul>
        <p>We may also share data if the law requires it, for example to answer a valid request from a court.</p>
      </>
    ),
  },
  {
    id: "google-data",
    title: "Google sign-in data",
    body: (
      <p>
        When you sign in with Google, we receive only your name, email address and profile picture. We use them only to
        create your account, sign you in and show who is signed in. We don't use Google user data for ads, we don't sell
        it, and we don't use it to train AI models. Lerno's use of information received from Google APIs follows the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
    ),
  },
  {
    id: "storage-and-security",
    title: "Where your data is kept, and for how long",
    body: (
      <>
        <p>
          Our service providers keep your data on servers outside India, including in the United States. By using Lerno,
          you understand that your data is sent there.
        </p>
        <p>
          We keep your account and what you created for as long as your account exists. When you ask us to delete your
          account, we delete your account, lessons, tutor chats and notes within 30 days. Server logs are kept for a
          short time by our providers and then deleted.
        </p>
        <p>
          We protect your data with encrypted connections (HTTPS), checks so each account can reach only its own lessons
          and notes, and hashed passwords. No system is fully secure, but if a breach affects your data, we will tell
          you and the authorities as the law requires.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what data we hold about you, and give you a copy;</li>
          <li>correct data that is wrong;</li>
          <li>delete your account and your data;</li>
          <li>stop using your data, by withdrawing your agreement.</li>
        </ul>
        <p>
          Email {MAIL} from the address on your account. We reply within 30 days. If you are not happy with our answer,
          you can complain to the Data Protection Board of India, or, if you live in the European Union or the United
          Kingdom, to your local data protection authority. You can also name a person to use these rights for you.
        </p>
      </>
    ),
  },
  {
    id: "browser-storage",
    title: "Cookies and browser storage",
    body: (
      <p>
        We don't use advertising or tracking cookies. Our visit counts don't use third-party cookies and don't build a
        profile of you. Lerno uses your browser's storage only to keep you signed in and to remember your settings and
        progress. You can clear it in your browser settings at any time; you will then be signed out and lose your saved
        progress on that device.
      </p>
    ),
  },
  {
    id: "children",
    title: "Students under 18",
    body: (
      <p>
        Many Lerno users are school students. If you are under 18, you may use Lerno only with the permission of a
        parent or guardian, who should read this policy with you. We collect only what Lerno needs to work, and we never
        show ads or build profiles of children. A parent or guardian can ask us to see or delete a child&apos;s data at{" "}
        {MAIL}.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we will update the date at the top. If a change affects how we use your data in an
        important way, we will tell you by email or in the app before it applies.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={
        <p>
          Lerno turns maths questions into short animated lessons. To do that, it needs a little of your data. This page
          explains, in plain words, what we collect, why, who helps us, and the choices you have.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
