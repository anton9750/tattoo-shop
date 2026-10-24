import LegalLayout from '../components/LegalLayout'

export default function Terms() {
  return (
    <LegalLayout title="Vilkår og betingelser" updated="24. oktober 2026">
      <p>
        Disse vilkår gælder for alle, der bruger InkMap — både besøgende, der søger en tatovør,
        og tatovører med en profil på platformen. Ved at bruge InkMap accepterer du vilkårene.
      </p>

      <h2>1. Hvad InkMap er</h2>
      <p>
        InkMap er en formidlingstjeneste. Vi viser tatovørers portfolio og sender booking-
        forespørgsler videre til dem. InkMap udfører ikke selv tatoveringer og er ikke part i
        aftalen mellem dig og tatovøren — den aftale, prisen og depositum indgår I direkte med
        hinanden.
      </p>

      <h2>2. Profiler for tatovører</h2>
      <ul>
        <li>Du skal give korrekte oplysninger om dig selv og dit studie ved oprettelse.</li>
        <li>Du må kun uploade billeder af arbejde, du selv har rettighederne til.</li>
        <li>Du er selv ansvarlig for at overholde gældende lovgivning for tatovering i Danmark.</li>
        <li>InkMap kan fjerne en profil, der overtræder disse vilkår eller indeholder vildledende information.</li>
      </ul>

      <h2>3. Booking-forespørgsler</h2>
      <p>
        Når en besøgende sender en booking-forespørgsel, videresendes oplysningerne til den
        valgte tatovør. Det er tatovørens ansvar at svare, bekræfte tid og opkræve depositum.
        InkMap garanterer ikke, at en forespørgsel besvares inden for en bestemt tid.
      </p>

      <h2>4. Ansvarsbegrænsning</h2>
      <p>
        InkMap stilles til rådighed, som det er. Vi tilstræber, at platformen er tilgængelig og
        korrekt, men kan ikke garantere fejlfri drift. InkMap er ikke ansvarlig for tvister,
        skader eller utilfredshed, der opstår mellem en besøgende og en tatovør.
      </p>

      <h2>5. Opsigelse</h2>
      <p>
        Du kan til enhver tid bede om at få din profil og dine data slettet ved at kontakte os,
        se <a href="/kontakt">Kontakt</a>.
      </p>

      <h2>6. Ændringer</h2>
      <p>Vi kan opdatere disse vilkår løbende. Væsentlige ændringer vil blive annonceret på siden.</p>

      <h2>7. Lovvalg</h2>
      <p>Disse vilkår er underlagt dansk ret.</p>
    </LegalLayout>
  )
}
