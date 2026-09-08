import type { Metadata } from "next";
import Link from "next/link";
import { Check, Phone, ArrowRight, Truck, BadgeDollarSign, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/PageShell";
import { SITE, CITIES } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "Carros Viejos | Vende Tu Auto Viejo Rápido por Dinero en Dallas",
  description:
    "Junkerz compra carros viejos, chocados y que no arrancan en Dallas–Fort Worth. Oferta en un minuto, grúa gratis y pago en efectivo. Llama al 817-420-9180.",
  alternates: {
    canonical: `${SITE.url}/carro-viejos`,
    languages: { "es-US": `${SITE.url}/carro-viejos`, "en-US": SITE.url },
  },
  openGraph: {
    title: "Vende tu carro viejo por dinero en efectivo",
    description: "Oferta garantizada en un minuto. Grúa gratis en todo DFW. Te pagamos al recoger el carro.",
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
];

export default function CarroViejos() {
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
    <PageShell
      eyebrow="Carros viejos · Dallas–Fort Worth"
      title="Vende tu carro viejo con Junkerz hoy"
      lede="Compramos carros viejos, chocados y que no arrancan en todo Dallas–Fort Worth. Le damos una oferta garantizada en un minuto, la grúa es gratis y le pagamos en efectivo cuando recogemos el carro."
    >
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-zinc-900">¿Listo para vender?</p>
            <p className="mt-1 text-sm text-zinc-700">
              Empiece en línea o llámenos. Hablamos español.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/quote">
              <Button className="h-12 w-full gap-2 px-6 font-bold sm:w-auto">
                Ver mi oferta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={SITE.phoneHref}>
              <Button variant="outline" className="h-12 w-full gap-2 px-5 font-bold sm:w-auto">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Compramos carros en cualquier condición
          </h2>
          <p className="mt-3">
            No importa si el carro está chocado, quemado, inundado, sin motor o si
            lleva años parado en el patio. Nosotros compramos carros, camionetas,
            vans y SUV en cualquier estado. Muchos compradores dicen que no. Nosotros
            decimos cuánto vale.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "Carros chocados y pérdidas totales del seguro",
              "Carros que no encienden ni caminan",
              "Carros sin título o con el título perdido",
              "Carros con daño de agua, granizo o fuego",
              "Carros abandonados en su propiedad o por un inquilino",
              "Camionetas y vans de trabajo que ya no sirven",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Así funciona, en tres pasos
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { icon: FileText, n: "01", t: "Cuéntenos del carro",
                b: "Año, marca, modelo y en qué condición está. Un minuto, sin crear cuenta." },
              { icon: BadgeDollarSign, n: "02", t: "Reciba su oferta",
                b: "Un número garantizado, calculado con el precio del metal, el catalítico y las piezas." },
              { icon: Truck, n: "03", t: "Nosotros lo recogemos",
                b: "Vamos a su casa en todo DFW, le entregamos el dinero y nos llevamos el carro gratis." },
            ].map(({ icon: Icon, n, t, b }) => (
              <div key={n} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-emerald-600" />
                  <span className={`text-sm font-bold text-emerald-700/70 ${mono}`}>{n}</span>
                </div>
                <h3 className="mt-3 font-bold text-zinc-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            ¿Su carro no arranca? Todavía vale dinero
          </h2>
          <p className="mt-3">
            Mucha gente cree que un carro que no enciende no vale nada. No es así.
            El peso del metal tiene precio en el mercado todos los días, el convertidor
            catalítico vale por sí solo, y las llantas, los vidrios, las puertas y los
            asientos se siguen vendiendo. Nada de eso necesita que el motor prenda.
          </p>
          <p className="mt-3">
            El carro tampoco necesita rodar ni tener aire en las llantas. Nuestros
            choferes llevan el equipo para levantar un carro que no se mueve solo.
            Puede estar en el pasto, en bloques o con una llanta ponchada.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Preguntas frecuentes
          </h2>
          <div className="mt-5 divide-y divide-zinc-200">
            {FAQ_ES.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className={`text-2xl leading-none text-emerald-600 transition-transform group-open:rotate-45 ${mono}`}>+</span>
                </summary>
                <p className="mt-2.5 text-zinc-600">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Ciudades donde recogemos
          </h2>
          <p className="mt-2 text-zinc-600">La grúa es gratis en todas estas ciudades.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CITIES.map((x) => (
              <Link key={x.slug} href={`/cash-for-junk-cars/${x.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:border-emerald-600 hover:text-emerald-700">
                {x.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 rounded-3xl bg-emerald-600 px-8 py-12 text-white">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight">
          Reciba su oferta hoy
        </h2>
        <p className="mt-3 max-w-xl text-emerald-50">
          Un minuto en línea y sabrá cuánto vale su carro. Sin compromiso, sin costo
          de grúa y con pago en efectivo el día que lo recogemos.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/quote">
            <Button className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-emerald-700 hover:bg-emerald-50 sm:w-auto">
              Ver mi oferta <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <a href={SITE.phoneHref}>
            <Button variant="outline"
              className="h-14 w-full gap-2 border-white/40 bg-transparent px-6 text-base font-bold text-white hover:bg-white/10 sm:w-auto">
              <Phone className="h-4 w-4" /> Llame al {SITE.phone}
            </Button>
          </a>
        </div>
      </div>
    </PageShell>
  );
}
