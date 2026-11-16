import { SellFlow } from "@/components/sell-flow";
import { copy } from "@/content/copy";

export default function HomePage() {
  return (
    <>
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#valuation" className="font-display text-[1.7rem] leading-none tracking-tight">
            {copy.brand}
          </a>
          <p className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {copy.header.demo}
          </p>
        </div>
      </header>
      <main className="flex-1">
        <noscript>
          <p className="mx-auto w-full max-w-6xl px-4 py-3 text-sm sm:px-6">{copy.noscript}</p>
        </noscript>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:gap-x-16 lg:py-16">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{copy.hero.eyebrow}</p>
            <h1 className="font-display mt-3 max-w-xl text-[2.6rem] leading-[1.02] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">{copy.hero.lede}</p>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-6">
            <SellFlow />
          </div>
          <div className="grid gap-10 lg:col-start-1 lg:row-start-2">
            <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {copy.trust.map((item) => (
                <li key={item.title} className="grid gap-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
            <section aria-labelledby="how-heading" className="grid gap-4">
              <h2 id="how-heading" className="font-display text-2xl tracking-tight">
                {copy.how.title}
              </h2>
              <ol className="grid gap-4">
                {copy.how.steps.map((step, index) => (
                  <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="font-display text-xl text-primary">{index + 1}</span>
                    <span>
                      <span className="block font-medium">{step.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="plates-heading" className="grid gap-4">
              <div className="grid gap-2">
                <h2 id="plates-heading" className="font-display text-2xl tracking-tight">
                  {copy.plates.title}
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{copy.plates.intro}</p>
              </div>
              <ul className="grid gap-2">
                {copy.demoPlates.map((plate) => (
                  <li key={plate.vrm} className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
                    <span className="rounded-md bg-[#f4c400] px-2 py-1 text-center text-sm font-semibold tracking-[0.08em] text-[#1a160f]">
                      {plate.vrm}
                    </span>
                    <span className="text-sm text-muted-foreground">{plate.caption}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <footer className="border-t border-border/80">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-8 text-sm leading-relaxed text-muted-foreground sm:px-6">
          <p>{copy.footer.disclaimer}</p>
          <p>{copy.footer.affiliation}</p>
        </div>
      </footer>
    </>
  );
}
