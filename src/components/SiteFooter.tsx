import Link from "next/link";
import Logo from "@/components/Logo";
import { Phone } from "lucide-react";
import { SITE, CITIES } from "@/lib/site";
import { getCatalogSettings, type CatalogSettings } from "@/lib/shop-catalog";
const mono = "font-[family-name:var(--font-geist-mono)]";

export async function SiteFooter({ phone, catalogSettings }: { phone?: string; catalogSettings?: CatalogSettings | null }) {
  const p = phone || SITE.phone;
  const telHref = `tel:+1${p.replace(/\D/g, "")}`;
  let settings = catalogSettings;
  if (settings === undefined) {
    try { settings = await getCatalogSettings(); } catch { settings = null; }
  }
  const showShop = Boolean(settings && Object.values(settings.sections).some((mode) => mode !== "off"));
  const hasLive = Boolean(settings && Object.values(settings.sections).some((mode) => mode === "live"));
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-zinc-900">
              <Logo height={28} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Buying junk, wrecked and non-running cars across Dallas–Fort Worth
              since {SITE.founded}. Free towing, cash at pickup.
            </p>
            <a href={telHref} className={`mt-4 inline-flex items-center gap-1.5 font-bold text-zinc-900 hover:text-brand-700 ${mono}`}>
              <Phone className="h-4 w-4" /> {p}
            </a>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">Sell your car</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link href="/quote" className="hover:text-brand-700">Get an instant offer</Link></li>
              <li><Link href="/junk-cars" className="hover:text-brand-700">Wrecked &amp; junk cars</Link></li>
              <li><Link href="/not-running" className="hover:text-brand-700">Cars that will not start</Link></li>
              <li><Link href="/unwanted-cars" className="hover:text-brand-700">Unwanted cars</Link></li>
              <li><Link href="/carro-viejos" className="hover:text-brand-700">Español · Carros viejos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link href="/about-us" className="hover:text-brand-700">About us</Link></li>
              <li><Link href="/contact-us" className="hover:text-brand-700">Contact us</Link></li>
              {showShop && <li><Link href="/shop" className="hover:text-brand-700">Cars &amp; parts{!hasLive && " · Coming soon"}</Link></li>}
              <li><Link href="/assistants" className="hover:text-brand-700">AI assistants</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-brand-700">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-700">Terms of service</Link></li>
              <li><Link href="/account" className="hover:text-brand-700">My Junkerz</Link></li>
              <li><a href="/buyers/login" className="hover:text-brand-700">Salvage yard login</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">Popular areas</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {CITIES.slice(0, 8).map((x) => (
                <li key={x.slug}>
                  <Link href={`/cash-for-junk-cars/${x.slug}`} className="hover:text-brand-700">
                    Junk cars in {x.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {SITE.legal}. {SITE.street}, {SITE.city}, {SITE.state} {SITE.postal}.</span>
          <a href={`mailto:${SITE.email}`} className="underline hover:text-zinc-800">{SITE.email}</a>
        </div>
      </div>
    </footer>
  );
}
