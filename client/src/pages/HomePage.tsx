// pages/HomePage.tsx
import { Link } from "react-router-dom";
import { Star, ArrowRight, Truck, ShieldCheck, Globe2, Sparkles } from "lucide-react";
import HeroBG from "../assets/bg.png";
import Product from "../assets/bg2.jpg";

const RatingStars = ({ value = 5 }: { value?: number }) => (
  <div className="flex items-center gap-0.5 text-amber-400">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={16} className={i < value ? "fill-current" : ""} />
    ))}
  </div>
);

export function HomePage() {
  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: `url(${HeroBG})` }}
      >
        {/* Background image layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HeroBG})` }}
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.28),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_35%)]" />

        <div className="relative container mx-auto px-6 md:px-16 pt-14 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Philippine goods delivered with care — COD available</span>
            </div>

            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-tight">
              Carrying Home Filipino Treasures <span className="text-amber-400">closer</span> To Your Door Step.
            </h1>

            <p className="mt-5 text-base md:text-lg text-white/80 leading-relaxed">
              Discover curated Filipino favorites—snacks, crafts, and essentials—packed safely and shipped
              with reliable updates from checkout to doorstep.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-6 py-3 font-semibold transition-all shadow-lg shadow-amber-600/20 active:scale-[0.98]"
              >
                View Products <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 font-semibold transition-all backdrop-blur"
              >
                Learn More
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-400" />
                  <p className="font-semibold">Fast Dispatch</p>
                </div>
                <p className="mt-1 text-sm text-white/75">
                  Orders are prepared quickly and packed carefully.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  <p className="font-semibold">Secure Packaging</p>
                </div>
                <p className="mt-1 text-sm text-white/75">
                  We protect goods to arrive clean and intact.
                </p>
              </div>

              <div className="rounded-xl border borderwhite/10 border border-white/10 bg-black/30 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-amber-400" />
                  <p className="font-semibold">Curated Picks</p>
                </div>
                <p className="mt-1 text-sm text-white/75">
                  Filipino favorites, chosen for quality and authenticity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-gradient-to-b from-black to-stone-900 py-20 px-6 md:px-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-amber-600/10 blur-2xl" />
              <img
                src={Product}
                alt="KargaGo featured products"
                className="relative w-full max-w-[520px] mx-auto rounded-2xl shadow-2xl shadow-black/40 border border-white/10"
              />
            </div>

            <div>
              <p className="text-amber-400 uppercase tracking-widest text-sm mb-2">
                About KargaGo
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Built to carry what matters.
              </h2>

              <p className="text-stone-300 leading-relaxed text-lg">
                KargaGo was founded with a simple purpose — to help Filipinos move what matters.
                Inspired by the word “karga” which means to carry, our platform is built to lift the
                everyday needs of our community. Whether for business, family, or personal essentials,
                KargaGo is here to move your goods with care, speed, and heart.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/menu"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-6 py-3 font-semibold transition-all"
                >
                  Explore the catalog <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR PICKS */}
      <section className="py-20 bg-black px-6 md:px-16">
        <div className="container mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold">Popular Picks</h2>
              <p className="mt-2 text-white/70">
                Community favorites you might want to try first.
              </p>
            </div>
            <Link
              to="/menu"
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-2"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-stone-900/70 border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-amber-600/10 transition-all">
              <div className="overflow-hidden rounded-xl">
                <img
                  src="/products/mangoes.jpg"
                  alt="Mangoes"
                  className="w-full h-48 object-cover rounded-xl group-hover:scale-[1.03] transition-transform"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Mangoes</h3>
                <span className="text-xs rounded-full bg-amber-500/15 text-amber-300 px-3 py-1 border border-amber-500/20">
                  Best Seller
                </span>
              </div>
              <p className="text-white/70 text-sm mt-2">
                Sweet and vibrant—classic Filipino favorite.
              </p>
            </div>

            <div className="group bg-stone-900/70 border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-amber-600/10 transition-all">
              <div className="overflow-hidden rounded-xl">
                <img
                  src="/products/pastillas.jpg"
                  alt="Pastillas"
                  className="w-full h-48 object-cover rounded-xl group-hover:scale-[1.03] transition-transform"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Pastillas</h3>
                <span className="text-xs rounded-full bg-white/10 text-white/80 px-3 py-1 border border-white/10">
                  Classic
                </span>
              </div>
              <p className="text-white/70 text-sm mt-2">
                Creamy bite-sized goodness—perfect for gifting.
              </p>
            </div>

            <div className="group bg-stone-900/70 border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-amber-600/10 transition-all">
              <div className="overflow-hidden rounded-xl">
                <img
                  src="/products/ube-in-a-jar.jpg"
                  alt="Fila Manila Ube"
                  className="w-full h-48 object-cover rounded-xl group-hover:scale-[1.03] transition-transform"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Fila Manila Ube</h3>
                <span className="text-xs rounded-full bg-amber-500/15 text-amber-300 px-3 py-1 border border-amber-500/20">
                  Trending
                </span>
              </div>
              <p className="text-white/70 text-sm mt-2">
                Rich ube flavor—great for desserts and spreads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-stone-900 px-6 md:px-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold">Feedback & Ratings</h2>
            <p className="mt-3 text-stone-300">
              What customers say about KargaGo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-stone-800/70 border border-white/10 p-7 rounded-2xl shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/30 to-white/10 border border-white/10" />
                  <div>
                    <p className="font-bold text-white">Daniel Canatoy</p>
                    <RatingStars value={5} />
                  </div>
                </div>
                <span className="text-xs rounded-full bg-amber-500/15 text-amber-300 px-3 py-1 border border-amber-500/20">
                  Verified
                </span>
              </div>
              <p className="mt-4 text-stone-300 leading-relaxed">
                Authentic and products were delivered safely!
              </p>
            </div>

            <div className="bg-stone-800/70 border border-white/10 p-7 rounded-2xl shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/30 to-white/10 border border-white/10" />
                  <div>
                    <p className="font-bold text-white">Marvin San Diego</p>
                    <RatingStars value={5} />
                  </div>
                </div>
                <span className="text-xs rounded-full bg-amber-500/15 text-amber-300 px-3 py-1 border border-amber-500/20">
                  Verified
                </span>
              </div>
              <p className="mt-4 text-stone-300 leading-relaxed">
                Full of unique goods of the Philippines. Very efficient shop!
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-6 py-3 font-semibold transition-all shadow-lg shadow-amber-600/20 active:scale-[0.98]"
            >
              Start shopping <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
