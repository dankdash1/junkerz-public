import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata:Metadata={title:'My Junkerz',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Layout({children}:{children:React.ReactNode}) {
 return <main className="min-h-screen bg-zinc-50 text-zinc-900"><header className="border-b bg-white"><nav aria-label="My Junkerz" className="mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-5 py-5"><Link className="text-xl font-extrabold text-brand-700" href="/account">My Junkerz</Link><Link href="/shop">Cars &amp; parts</Link><Link href="/account/profile">Contact &amp; delivery</Link><Link href="/">Junkerz home</Link></nav></header><div className="mx-auto max-w-4xl px-5 py-10">{children}</div></main>;
}
