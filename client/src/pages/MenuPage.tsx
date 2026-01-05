import { useState, useEffect } from "react";
import { ProductCard } from "../components/ProductCard";
import { Filter } from "lucide-react";

export interface Products {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  in_stock: boolean;
}

export function MenuPage() {
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetch("http://localhost:5000/products")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        // Check what property contains the array
        // If the response is { products: [...] }
        setProducts(data.products || data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setProducts([]); // Set empty array on error
        setLoading(false);
      });
  }, []);

  const categories = [
    { value: "all", label: "All Items" },
    { value: "snacks", label: "Snacks" },
    { value: "agricultural", label: "Agricultural" },
    { value: "organic", label: "Organic" },
    { value: "regionalSpecialty", label: "Regional Specialty" },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-stone-900 mb-4">Our Menu</h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Experience the unique flavors and crafts of the Philippines.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-stone-700 font-medium">
            <Filter className="w-5 h-5" />
            <span>Filter by:</span>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category.value
                    ? "bg-amber-600 text-white shadow-lg scale-105"
                    : "bg-white text-stone-700 hover:bg-stone-100 shadow-md hover:shadow-lg"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-stone-600">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
