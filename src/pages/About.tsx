import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="font-display text-4xl font-bold">Om InkMap</h1>
      <p className="mt-4 text-paper-dim/90">
        InkMap samler danske tatovørers arbejde ét sted, så man kan finde en kunstner efter stil
        og by — og booke en konsultation direkte, uden at det drukner i en DM-tråd.
      </p>
      <p className="mt-4 text-paper-dim/90">
        Vi tror på, at gode tatovører fortjener at blive fundet af de rigtige kunder, og at kunder
        fortjener en nem og tryg måde at tage det første skridt på. Derfor er InkMap gratis at
        bruge for besøgende, og gratis at få en profil for tatovører.
      </p>
      <p className="mt-6 text-paper-dim/90">
        Har du spørgsmål, eller vil du være med? Gå til <Link to="/kontakt" className="text-brass hover:underline">Kontakt</Link>{' '}
        eller <Link to="/for-tatovorer" className="text-brass hover:underline">bliv tatovør på InkMap</Link>.
      </p>
    </div>
  )
}
