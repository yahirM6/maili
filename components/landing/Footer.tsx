export default function Footer() {
  return (
    <footer className="flex items-end justify-between bg-white p-5 md:p-8">
      <span className="font-serif text-5xl font-light uppercase leading-none md:text-7xl">Maili</span>
      <a
        href="#catalog"
        className="text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-50"
      >
        Back to catalog
      </a>
    </footer>
  )
}
