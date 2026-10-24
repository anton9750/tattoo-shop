import { db } from './db.js'

const titleBank = {
  Finelinje: ['Lavendelgren', 'Måneskitse', 'Svale i flugt', 'Tynd rose', 'Konturblad'],
  Blackwork: ['Sort panel', 'Skygge-ulv', 'Tung ornament', 'Fuld ærme-sketch', 'Negativt rum'],
  Traditionelt: ['Anker og rose', 'Panter-hoved', 'Dolk og bånd', 'Klassisk svale', 'Skib i storm'],
  Japansk: ['Koi i strøm', 'Hannya-maske', 'Kirsebærgren', 'Drage over bølge', 'Foo-hund'],
  Realisme: ['Portræt i gråtone', 'Ulveøje', 'Timeglas', 'Fjer i detalje', 'Løve-studie'],
  Geometrisk: ['Mandala-cirkel', 'Sacred geometry', 'Facet-dyr', 'Linjenet', 'Trekant-komposition'],
  Akvarel: ['Farvesprøjt fugl', 'Akvarel-blomst', 'Galakse-stænk', 'Bløde striber', 'Vandfarve-ravn'],
  Dotwork: ['Prikket mandala', 'Stiplet måne', 'Dotwork-ørn', 'Finjusteret mønster', 'Mørk gradient'],
}

const seedArtists = [
  { id: 'freja-holm', name: 'Freja Holm', studio: 'Sorte Fugl Tattoo', city: 'København', styles: ['Finelinje', 'Dotwork'], bio: 'Freja arbejder med tynde, rolige linjer og botaniske motiver. Hun bruger god tid på hver skitse, så den passer til din krop og din historie.', instagram: 'instagram.com/sortefugl.freja', bookingLeadTime: 'Ventetid: ca. 3 uger', depositDkk: 500, rating: 4.9, reviewCount: 86 },
  { id: 'mikkel-bruun', name: 'Mikkel Bruun', studio: 'Blackgate Studio', city: 'Aarhus', styles: ['Blackwork', 'Geometrisk'], bio: 'Mikkel tatoverer tunge, grafiske blackwork-stykker med fokus på symmetri og store flader. Specialist i ærmer og ryg-paneler.', instagram: 'instagram.com/blackgate.mikkel', bookingLeadTime: 'Ventetid: ca. 6 uger', depositDkk: 1000, rating: 4.8, reviewCount: 142 },
  { id: 'sofie-aagaard', name: 'Sofie Aagaard', studio: 'Rosenhave Tattoo', city: 'Odense', styles: ['Akvarel', 'Realisme'], bio: 'Sofie maler mere end hun tatoverer — kendt for bløde farveovergange og portrætter med akvarel-finish.', instagram: 'instagram.com/rosenhave.sofie', bookingLeadTime: 'Ventetid: ca. 4 uger', depositDkk: 750, rating: 4.9, reviewCount: 61 },
  { id: 'anders-kjeldsen', name: 'Anders Kjeldsen', studio: 'Havnefront Ink', city: 'København', styles: ['Traditionelt'], bio: 'Gammeldags amerikansk traditionelt — tykke konturer, klare farver, motiver der holder i 30 år. 15 års erfaring.', instagram: 'instagram.com/havnefront.anders', bookingLeadTime: 'Ventetid: ca. 2 uger', depositDkk: 500, rating: 5.0, reviewCount: 203 },
  { id: 'yuki-noergaard', name: 'Yuki Nørgaard', studio: 'Kirin Tattoo', city: 'Aarhus', styles: ['Japansk', 'Blackwork'], bio: 'Opvokset mellem Osaka og Aarhus. Tatoverer irezumi-inspirerede helkropsstykker og mindre japansk-stil motiver.', instagram: 'instagram.com/kirin.yuki', bookingLeadTime: 'Ventetid: ca. 8 uger', depositDkk: 1200, rating: 4.9, reviewCount: 97 },
  { id: 'ida-vestergaard', name: 'Ida Vestergaard', studio: 'Nordlys Tattoo', city: 'Aalborg', styles: ['Geometrisk', 'Dotwork'], bio: 'Matematisk præcise mandalaer og geometriske mønstre. Ida tegner alt i hånden, før det digitaliseres.', instagram: 'instagram.com/nordlys.ida', bookingLeadTime: 'Ventetid: ca. 5 uger', depositDkk: 600, rating: 4.7, reviewCount: 54 },
  { id: 'tobias-lindgren', name: 'Tobias Lindgren', studio: 'Askegrå Studio', city: 'København', styles: ['Realisme'], bio: 'Fotorealistiske portrætter og dyremotiver i gråtoner. Tobias arbejder kun med ét stykke om dagen for at sikre kvaliteten.', instagram: 'instagram.com/askegra.tobias', bookingLeadTime: 'Ventetid: ca. 10 uger', depositDkk: 1500, rating: 5.0, reviewCount: 118 },
  { id: 'clara-munch', name: 'Clara Munch', studio: 'Rosenhave Tattoo', city: 'Odense', styles: ['Finelinje', 'Akvarel'], bio: 'Bløde, feminine motiver med fine detaljer — blomster, insekter og små tekst-tatoveringer.', instagram: 'instagram.com/rosenhave.clara', bookingLeadTime: 'Ventetid: ca. 3 uger', depositDkk: 450, rating: 4.8, reviewCount: 72 },
]

export async function seedIfEmpty() {
  if ((await db.listArtists()).length > 0) return

  for (const artist of seedArtists) {
    const createdAt = new Date().toISOString()
    await db.createArtist({
      ...artist,
      userId: null,
      avatar: `https://picsum.photos/seed/${artist.id}/160/160`,
      createdAt,
    })

    // each seed artist gets 6 designs cycling through their styles
    for (let i = 0; i < 6; i++) {
      const style = artist.styles[i % artist.styles.length]
      const titles = titleBank[style] ?? ['Motiv']
      const title = titles[i % titles.length]
      const tall = i % 3 === 0
      const seed = `${artist.id}-design-${i}`
      await db.createDesign({
        id: seed,
        artistId: artist.id,
        title,
        style,
        image: `https://picsum.photos/seed/${seed}/${tall ? '640/860' : '640/520'}`,
        width: 640,
        height: tall ? 860 : 520,
      })
    }
  }

  console.log(`Seedede ${seedArtists.length} eksempel-tatovører.`)
}
