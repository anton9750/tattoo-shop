import nodemailer from 'nodemailer'

const FROM = process.env.MAIL_FROM ?? '"InkMap" <no-reply@inkmap.dk>'

let transporterPromise = null
let usingTestAccount = false

function createTransporter() {
  if (process.env.SMTP_HOST) {
    usingTestAccount = false
    return Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      }),
    )
  }

  // No SMTP configured — use a disposable Ethereal test inbox so email
  // sending still genuinely works in development. Every send logs a
  // preview link instead of landing in a real mailbox.
  usingTestAccount = true
  return nodemailer.createTestAccount().then((account) => {
    console.log('Ingen SMTP_HOST sat — bruger et midlertidigt test-mailbox (Ethereal) til e-mails.')
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    })
  })
}

function getTransporter() {
  if (!transporterPromise) transporterPromise = createTransporter()
  return transporterPromise
}

async function send({ to, subject, html, text }) {
  const transporter = await getTransporter()
  const info = await transporter.sendMail({ from: FROM, to, subject, html, text })
  if (usingTestAccount) {
    console.log(`✉ "${subject}" til ${to} — se den her: ${nodemailer.getTestMessageUrl(info)}`)
  }
  return info
}

function layout(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; background:#16140f; color:#ede6d6; padding:32px;">
      <div style="max-width:480px; margin:0 auto;">
        <p style="font-size:20px; font-weight:bold; margin:0 0 24px;">
          Ink<span style="color:#8c1f28;">Map</span>
        </p>
        <h1 style="font-size:20px; margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  `
}

export async function sendBookingReceivedToArtist(artist, booking, artistEmail) {
  await send({
    to: artistEmail,
    subject: `Ny booking-forespørgsel fra ${booking.name}`,
    html: layout(
      'Ny booking-forespørgsel',
      `<p>${booking.name} har sendt en forespørgsel om en tatovering.</p>
       <p><strong>Placering:</strong> ${booking.placement}<br>
          <strong>Størrelse:</strong> ${booking.size}<br>
          ${booking.preferredDates ? `<strong>Ønsket periode:</strong> ${booking.preferredDates}<br>` : ''}
          <strong>Kontakt:</strong> ${booking.email} · ${booking.phone}</p>
       ${booking.message ? `<p><em>"${booking.message}"</em></p>` : ''}
       <p>Log ind på dit dashboard for at bekræfte eller afvise forespørgslen.</p>`,
    ),
  })
}

export async function sendBookingConfirmationToVisitor(booking, artist) {
  await send({
    to: booking.email,
    subject: `Din booking-forespørgsel til ${artist.name} er modtaget`,
    html: layout(
      'Forespørgsel modtaget',
      `<p>Hej ${booking.name},</p>
       <p>${artist.name} hos ${artist.studio} har modtaget din booking-forespørgsel og vender
          tilbage inden for 2-3 dage med en bekræftelse og et link til at betale depositum
          på ${artist.depositDkk} kr.</p>`,
    ),
  })
}

export async function sendBookingStatusUpdate(booking, artist) {
  const confirmed = booking.status === 'bekræftet'
  await send({
    to: booking.email,
    subject: confirmed ? `${artist.name} har bekræftet din tid` : `Besked om din forespørgsel til ${artist.name}`,
    html: layout(
      confirmed ? 'Din tid er bekræftet' : 'Opdatering på din forespørgsel',
      confirmed
        ? `<p>Hej ${booking.name},</p>
           <p>${artist.name} har bekræftet din booking-forespørgsel. Du hører nærmere om tid og
              depositum direkte fra ${artist.name.split(' ')[0]}.</p>`
        : `<p>Hej ${booking.name},</p>
           <p>${artist.name} kan desværre ikke tage din forespørgsel i denne omgang. Prøv gerne
              en anden tatovør på InkMap.</p>`,
    ),
  })
}

export async function sendWelcomeEmail(artist, email) {
  await send({
    to: email,
    subject: 'Velkommen til InkMap',
    html: layout(
      'Din profil er live',
      `<p>Hej ${artist.name},</p>
       <p>Din profil på InkMap er oprettet og synlig for besøgende med det samme. Log ind på dit
          dashboard for at tilføje motiver og styre dine booking-forespørgsler.</p>`,
    ),
  })
}

export async function sendPasswordResetEmail(email, resetUrl) {
  await send({
    to: email,
    subject: 'Nulstil din adgangskode på InkMap',
    html: layout(
      'Nulstil adgangskode',
      `<p>Du har bedt om at nulstille din adgangskode. Linket er gyldigt i 1 time.</p>
       <p><a href="${resetUrl}" style="color:#b08d4f;">Nulstil adgangskode</a></p>
       <p>Har du ikke bedt om dette, kan du roligt ignorere denne mail.</p>`,
    ),
  })
}
