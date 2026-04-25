import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 p-6">
      <header className="max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-5xl font-bold text-slate-900">
          Get Cash for Your Junk Car
        </h1>
        <p className="mt-4 text-xl text-slate-700">
          Instant quote • Free pickup • Paid on the spot
        </p>
        <Link href="/quote">
          <Button size="lg" className="mt-8 h-14 px-10 text-lg">
            Get My Offer →
          </Button>
        </Link>
      </header>

      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
        {[
          ["Quote in 60s", "Tell us your year, make, and condition."],
          ["Free pickup", "Our driver comes to you in a 2-day window."],
          ["Paid on pickup", "Cash, check, or Zelle when title transfers."],
        ].map(([title, body]) => (
          <div key={title} className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="mt-2 text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <footer className="max-w-4xl mx-auto text-center text-sm text-slate-500 pt-12 pb-6">
        Junkerz LLC • <a href="mailto:hello@junkerz.com" className="underline">hello@junkerz.com</a>
      </footer>
    </main>
  );
}
