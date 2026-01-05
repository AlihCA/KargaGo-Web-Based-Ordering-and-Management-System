import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import HeroBG from "../assets/bg.png";
import Splash1 from "../assets/bg2.jpg";

export function HomePage() {
  return (
    <div className="min-h-screen w-full bg-black">
      <section
        className="relative h-[550px] bg-cover bg-center flex flex-col justify-between"
        style={{ backgroundImage: `url(${HeroBG})` }}
      >
        <div className="absolute inset-0 bg-black/5"></div>

        <div className="relative text-white px-6 md:px-16 flex-1 flex items-center">
          <div className="max-w-2xl">
            <p className="text-xl mb-2 tracking-wide opacity-90"></p>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              
            </h1>

            <Link
              to="/menu"
              className="mt-10 block mx-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all shadow-lg"
            >
              View Products
            </Link>

          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-black to-stone-900 py-24 px-6 md:px-16 text-white">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <img src={Splash1} className="w-[320px] mx-auto" />

          <div>
            <h3 className="text-amber-400 uppercase tracking-widest mb-2">
              About us
            </h3>
            <h2 className="text-4xl font-bold mb-4">About KargaGo</h2>

            <p className="text-stone-300 leading-relaxed text-lg">
              KargaGo was founded with a simple purpose — to help Filipinos move
              what matters. Inspired by the word “karga” which means to carry,
              our platform is built to lift the everyday needs of our community.
              Whether for business, family, or personal essentials, KargaGo is
              here to move your goods with care, speed, and heart
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-black px-6 md:px-16 text-white">
        <h2 className="text-4xl font-bold text-center mb-12">Popular Picks</h2>

        <div className="flex items-center justify-center gap-10 flex-wrap">
          <div className="bg-stone-900 rounded-xl p-5 w-[280px] shadow-lg">
            <img src="public/products/mangoes.jpg" className="rounded-xl mb-4" />
            <h3 className="text-xl font-bold">Mangoes</h3>
            <p className="text-amber-400 mt-1"></p>
          </div>

          <div className="bg-stone-900 rounded-xl p-5 w-[280px] shadow-lg">
            <img src="public/products/pastillas.jpg" className="rounded-xl mb-4" />
            <h3 className="text-xl font-bold">Pastillas</h3>
            <p className="text-amber-400 mt-1"></p>
          </div>

          <div className="bg-stone-900 rounded-xl p-5 w-[280px] shadow-lg">
            <img src="public/products/ube-in-a-jar.jpg" className="rounded-xl mb-4" />
            <h3 className="text-xl font-bold">Fila Manila Ube</h3>
            <p className="text-amber-400 mt-1"></p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-stone-900 text-white px-6 md:px-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Feedback & Ratings
        </h2>

        <div className="flex flex-wrap justify-center gap-10">
          <div className="bg-stone-800 w-[380px] p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-stone-700 rounded-full"></div>
              <div>
                <p className="font-bold">Daniel Canatoy</p>
                <div className="flex text-amber-400">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                </div>
              </div>
            </div>
            <p className="text-stone-300">
              Authentic and products were delivered safely!
            </p>
          </div>

          <div className="bg-stone-800 w-[380px] p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-stone-700 rounded-full"></div>
              <div>
                <p className="font-bold">Marvin San Diego</p>
                <div className="flex text-amber-400">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                </div>
              </div>
            </div>
            <p className="text-stone-300">
              Full of unique goods of the Philippines. Very efficient shop!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
