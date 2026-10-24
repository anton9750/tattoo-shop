import LegalLayout from '../components/LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Privatlivspolitik" updated="24. oktober 2026">
      <p>
        Denne politik beskriver, hvilke persondata InkMap behandler, hvorfor, og hvilke
        rettigheder du har. Vi behandler persondata i overensstemmelse med databeskyttelses-
        forordningen (GDPR) og databeskyttelsesloven.
      </p>

      <h2>1. Dataansvarlig</h2>
      <p>
        InkMap er dataansvarlig for behandlingen af de persondata, der beskrives her. Du kan
        kontakte os via siden <a href="/kontakt">Kontakt</a> med spørgsmål om dine data.
      </p>

      <h2>2. Hvilke data vi behandler</h2>
      <p>Afhængigt af hvordan du bruger InkMap, behandler vi:</p>
      <ul>
        <li>
          <strong>Besøgende, der booker en konsultation:</strong> navn, e-mail, telefonnummer,
          samt oplysninger du selv skriver om det ønskede motiv, placering og størrelse.
        </li>
        <li>
          <strong>Tatovører med en profil:</strong> navn, e-mail, krypteret adgangskode, studie,
          by, stilarter, bio, Instagram-handle og uploadede billeder.
        </li>
        <li>
          <strong>Besøgende, der bruger kontaktformularen:</strong> navn, e-mail og indholdet af
          beskeden.
        </li>
      </ul>

      <h2>3. Formål og retsgrundlag</h2>
      <ul>
        <li>At formidle booking-forespørgsler mellem besøgende og tatovører (kontrakt, GDPR art. 6(1)(b)).</li>
        <li>At oprette og drive en profil for tatovører, der selv opretter en konto (kontrakt, GDPR art. 6(1)(b)).</li>
        <li>At besvare henvendelser via kontaktformularen (legitim interesse, GDPR art. 6(1)(f)).</li>
      </ul>

      <h2>4. Hvor længe vi gemmer data</h2>
      <p>
        Vi gemmer data, så længe din profil eller booking-historik er aktiv, og sletter den
        efter din anmodning eller når den ikke længere er nødvendig til formålet.
      </p>

      <h2>5. Hvem vi deler data med</h2>
      <p>
        En booking-forespørgsel deles med den tatovør, du booker hos. Vi sælger ikke persondata
        til tredjepart og deler ikke dine data med andre, end hvad der er nødvendigt for at
        levere tjenesten.
      </p>

      <h2>6. Dine rettigheder</h2>
      <p>Du har efter databeskyttelsesreglerne ret til at:</p>
      <ul>
        <li>Få indsigt i de data, vi har om dig.</li>
        <li>Få urigtige data rettet.</li>
        <li>Få dine data slettet.</li>
        <li>Gøre indsigelse mod behandlingen eller bede om begrænsning.</li>
        <li>Få udleveret dine data i et maskinlæsbart format (dataportabilitet).</li>
      </ul>
      <p>
        Du kan bruge dine rettigheder ved at kontakte os via <a href="/kontakt">Kontakt</a>. Du
        kan også klage til Datatilsynet.
      </p>

      <h2>7. Cookies</h2>
      <p>
        InkMap bruger kun teknisk nødvendige cookies og lokal lagring (f.eks. til at huske, at du
        er logget ind). Vi bruger ikke tredjeparts sporings- eller marketingcookies.
      </p>
    </LegalLayout>
  )
}
