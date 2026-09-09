import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck, BadgeDollarSign, Phone, ClipboardList, ArrowRight,
  ShieldCheck, Quote, Wrench, FileText, Clock, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroQuoteForm, { ES } from "@/components/HeroQuoteForm";
import Logo from "@/components/Logo";
import StickyMobileBar from "@/components/StickyMobileBar";
import { SITE, TESTIMONIALS, CITIES } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "Carros Viejos | Vende Tu Auto Viejo por Dinero en Dallas",
  description:
    "Junkerz compra carros viejos, chocados y que no arrancan en Dallas–Fort Worth. Oferta en un minuto, grúa gratis y pago en efectivo. Llame al 817-420-9180.",
  alternates: {
    canonical: `${SITE.url}/carro-viejos`,
    languages: { "es-US": `${SITE.url}/carro-viejos`, "en-US": SITE.url },
  },
  openGraph: {
    title: "Vende tu carro viejo por dinero en efectivo | Junkerz",
    description: "Oferta garantizada en un minuto. Grúa gratis en todo DFW. Le pagamos al recoger el carro.",
    locale: "es_US",
    type: "website",
  },
};

const FAQ_ES: [string, string][] = [
  ["¿Necesito el título para vender mi carro?",
   "No siempre. En Texas muchas veces podemos comprarlo con el registro y su identificación con foto. Díganos su caso cuando pida la cotización y le explicamos exactamente qué se necesita antes de que salga la grúa."],
  ["¿La grúa de verdad es gratis?",
   "Sí, en toda nuestra área. No descontamos nada por la grúa ni por el papeleo. El número que usted acepta es el dinero que recibe en la mano."],
  ["Mi carro no enciende. ¿Todavía vale algo?",
   "Casi siempre sí. El valor está en el peso del metal, el convertidor catalítico y las piezas que aún sirven. Nada de eso necesita que el motor arranque. La mayoría de los carros que compramos no encienden."],
  ["¿Qué tan rápido lo pueden recoger?",
   "Normalmente entre 24 y 48 horas, y muchas veces el mismo día si está cerca de nuestro patio en el norte de Dallas. Si tiene una fecha límite del apartamento o de la ciudad, díganos y trabajamos con esa fecha."],
  ["¿Cómo me pagan?",
   "En efectivo, en el momento de recoger el carro, antes de subirlo a la grúa. Nunca un cheque por correo que usted tenga que perseguir."],
  ["¿Hasta dónde llegan?",
   "Alrededor de dos horas desde el centro de Dallas–Fort Worth. Llegamos hasta Gainesville por el norte, Midlothian y Ennis por el sur, Weatherford por el oeste y Greenville por el este."],
  ["¿Qué tipo de vehículos compran?",
   "Carros, camionetas, vans y SUV. Chocados, inundados, quemados, desarmados, con el motor pegado o simplemente acabados. También compramos vehículos que llevan años parados y no se mueven solos."],
];

export default function CarroViejos() {
  const telHref = SITE.phoneHref;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "es-US",
    mainEntity: FAQ_ES.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main className="min-h-screen bg-white pb-20 text-zinc-900 md:pb-0" lang="es">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* encabezado — todo en español */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/carro-viejos"><Logo height={34} priority /></Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 lg:flex">
            <Link href="/carro-viejos#compramos" className="hover:text-zinc-900">Qué compramos</Link>
            <Link href="/carro-viejos#como" className="hover:text-zinc-900">Cómo funciona</Link>
            <Link href="/carro-viejos#ciudades" className="hover:text-zinc-900">Ciudades</Link>
            <Link href="/" className="hover:text-zinc-900">English</Link>
          </nav>
          <div className="flex items-center gap-3">
            <a href={telHref}
               className={`hidden items-center gap-1.5 text-sm font-bold text-zinc-800 hover:text-brand-700 sm:flex ${mono}`}>
              <Phone className="h-4 w-4" /> {SITE.phone}
            </a>
            <Link href="/quote?lang=es">
              <Button className="h-10 px-4 font-semibold">Ver mi oferta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* portada — el motor de cotización al centro, igual que en inglés */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center md:py-16">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 ${mono}`}>
            Carros viejos · Dallas–Fort Worth
          </p>

          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
            Su carro viejo vale dinero. Sépalo en un minuto.
          </h1>

          <div className="mt-7">
            <HeroQuoteForm copy={ES} lang="es" />
          </div>

          <p className="mx-auto mt-7 max-w-xl text-lg text-zinc-600">
            Camine o no, chocado o muerto, con título o sin título. Díganos qué
            tiene y le damos un número garantizado. Grúa gratis en todo DFW y
            dinero en la mano cuando recogemos el carro.
          </p>

          <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-[15px] text-zinc-700 sm:grid-cols-2">
            {[
              [Truck, "Grúa gratis, siempre"],
              [BadgeDollarSign, "Efectivo al recoger el carro"],
              [FileText, "Muchas veces sin título"],
              [Clock, "Casi siempre en 24 a 48 horas"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Truck;
              return (
                <li key={t as string} className="flex items-center justify-center gap-2 sm:justify-start">
                  <I className="h-4 w-4 shrink-0 text-brand-600" />
                  <span>{t as string}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="text-sm text-zinc-500">¿Prefiere hablar? Hablamos español.</span>
            <a href={telHref}>
              <Button variant="outline"
                className="h-12 w-full gap-2 px-6 text-base font-bold sm:w-auto">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* cómo funciona */}
      <section id="como" className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 ${mono}`}>
            Cómo funciona
          </p>
          <h2 className="mt-3 max-w-xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tres pasos. Sin regateo y sin dealer.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: ClipboardList, n: "01", t: "Cuéntenos del carro",
                b: "Año, marca, modelo y en qué condición está. Como un minuto. Sin crear cuenta y sin buscar el número de serie." },
              { icon: BadgeDollarSign, n: "02", t: "Reciba su número real",
                b: "Una oferta garantizada, calculada con el precio del metal, el convertidor catalítico y las piezas que todavía se venden." },
              { icon: Truck, n: "03", t: "Lo recogemos y le pagamos",
                b: "Escoja la hora. Vamos a su casa en todo DFW, le entregamos el efectivo y nos llevamos el carro gratis." },
            ].map(({ icon: Icon, n, t, b }) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-7 w-7 text-brand-400" />
                  <span className={`text-sm font-semibold text-brand-400/80 ${mono}`}>{n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* qué compramos */}
      <section id="compramos" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Compramos carros en cualquier condición
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          No importa si el carro está chocado, quemado, inundado, sin motor o si
          lleva años parado en el patio. Compramos carros, camionetas, vans y SUV.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [Wrench, "Chocados y pérdidas totales", "Daño de frente, atrás o de lado, bolsas de aire activadas, pérdidas totales del seguro."],
            [Truck, "Que no encienden", "Motor pegado, transmisión quemada, años parados en la entrada."],
            [FileText, "Sin título o título perdido", "Manejamos el papeleo de Texas todos los días y le decimos qué necesita su caso."],
            [ShieldCheck, "Daño de agua o fuego", "El agua y el humo no le quitan el valor del metal ni de las piezas."],
            [BadgeDollarSign, "Mucho millaje", "Valen más con nosotros que lo que le ofreció el dealer de cambio."],
            [Check, "Abandonados en su propiedad", "Inquilinos y vecinos dejan carros atrás. Nosotros los sacamos."],
          ].map(([Icon, t, b]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={t as string} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <I className="h-6 w-6 text-brand-600" />
                <h3 className="mt-3 font-bold">{t as string}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{b as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* clientes */}
      <section className="border-y border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.slice(0, 3).map((t) => (
              <figure key={t.name} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <Quote className="h-6 w-6 text-brand-600" />
                <blockquote className="mt-3 text-[15px] leading-relaxed text-zinc-700">
                  {t.text}
                </blockquote>
                <figcaption className={`mt-4 text-sm font-bold text-zinc-900 ${mono}`}>
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* banda */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl bg-brand-600 px-8 py-12 text-white md:px-14 md:py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-brand-100">
                <ShieldCheck className="h-5 w-5" />
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${mono}`}>
                  ¿Sin título? ¿Motor muerto? Todavía vale dinero.
                </span>
              </div>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                Compramos los carros que otros rechazan.
              </h2>
              <p className="mt-3 text-brand-50">
                Un carro muerto todavía tiene valor real en el metal, el
                convertidor catalítico y las piezas que sirven. Eso es
                exactamente lo que pagamos.
              </p>
            </div>
            <Link href="/quote?lang=es" className="w-full md:w-auto">
              <Button className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-brand-700 hover:bg-brand-50 md:w-auto">
                Ver mi oferta <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ciudades */}
      <section id="ciudades" className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ciudades donde recogemos
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Cubrimos Dallas–Fort Worth y unas dos horas alrededor, desde
          Gainesville hasta Ennis y desde Weatherford hasta Greenville. La grúa
          es gratis en todas estas ciudades.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {CITIES.map((x) => (
            <Link key={x.slug} href={`/cash-for-junk-cars/${x.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-brand-600 hover:text-brand-700">
              {x.name}
            </Link>
          ))}
        </div>
      </section>

      {/* preguntas */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Preguntas frecuentes
        </h2>
        <div className="mt-8 divide-y divide-zinc-200">
          {FAQ_ES.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span className={`text-2xl leading-none text-brand-600 transition-transform group-open:rotate-45 ${mono}`}>
                  +
                </span>
              </summary>
              <p className="mt-3 text-zinc-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* pie */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Link href="/carro-viejos"><Logo height={28} /></Link>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Compramos carros viejos, chocados y que no arrancan en todo
                Dallas–Fort Worth desde {SITE.founded}. Grúa gratis y pago en
                efectivo al recoger.
              </p>
              <a href={telHref} className={`mt-4 inline-flex items-center gap-1.5 font-bold text-zinc-900 hover:text-brand-700 ${mono}`}>
                <Phone className="h-4 w-4" /> {SITE.phone}
              </a>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Venda su carro</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li><Link href="/quote?lang=es" className="hover:text-brand-700">Ver mi oferta</Link></li>
                <li><Link href="/carro-viejos#compramos" className="hover:text-brand-700">Qué compramos</Link></li>
                <li><Link href="/carro-viejos#como" className="hover:text-brand-700">Cómo funciona</Link></li>
                <li><Link href="/carro-viejos#ciudades" className="hover:text-brand-700">Ciudades</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Junkerz</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li><Link href="/" className="hover:text-brand-700">English site</Link></li>
                <li><Link href="/about-us" className="hover:text-brand-700">Sobre nosotros</Link></li>
                <li><Link href="/contact-us" className="hover:text-brand-700">Contáctenos</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-brand-700">Privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} {SITE.legal}. {SITE.street}, {SITE.city}, {SITE.state} {SITE.postal}.</span>
            <a href={`mailto:${SITE.email}`} className="underline hover:text-zinc-800">{SITE.email}</a>
          </div>
        </div>
      </footer>
      <StickyMobileBar es />
    </main>
  );
}
