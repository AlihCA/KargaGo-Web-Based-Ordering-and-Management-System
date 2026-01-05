import { Truck, MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white text-xl font-bold mb-4">
              <Truck className="w-6 h-6" />
              <span>KargaGo</span>
            </div>
            <p className="text-sm leading-relaxed">
              Exporting Philippine unique goods since 2024. Wherever you are, we
              bring the Philippines closer to you.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>#7 Joy Conde, Las Piñas City, Philippines</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>KargaGo@gmail.com</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <a href="">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Facebook className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>@KargaGo_PH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 flex-shrink-0" />
                  <span>@its_KargaGo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span></span>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} KargaGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
