import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ui/product-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useApp } from "@/contexts/AppContext";
import { Product } from "@shared/schema";
import { Package, Smartphone, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Products() {
  const { state, dispatch, filteredProducts } = useApp();
  const [searchInput, setSearchInput] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const handleFilterChange = (filterType: keyof typeof state.filters, value: string) => {
    const currentValue = state.filters[filterType];
    dispatch({
      type: "SET_FILTERS",
      payload: {
        [filterType]: currentValue === value ? "" : value,
      },
    });
  };

  const handleSearch = () => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: searchInput });
  };

  const clearFilters = () => {
    dispatch({ type: "SET_FILTERS", payload: { ageRange: "", type: "", category: "" } });
    dispatch({ type: "SET_SEARCH_QUERY", payload: "" });
    setSearchInput("");
  };

  const filtered = filteredProducts(products);

  const ageRanges = [
    { label: "3-5 años", value: "3-5", class: "age-badge-3-5" },
    { label: "6-8 años", value: "6-8", class: "age-badge-6-8" },
    { label: "9-12 años", value: "9-12", class: "age-badge-9-12" },
    { label: "13+ años", value: "13+", class: "age-badge-13-plus" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Catálogo Especializado</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Productos diseñados por profesionales para estimular el desarrollo integral de niños y adolescentes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 mb-12 shadow-lg">
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar productos..."
                className="pl-10"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="btn-gradient text-white">
              Buscar
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700 mb-3 block">Filtrar por edad:</span>
              <div className="flex flex-wrap gap-3">
                {ageRanges.map((age) => (
                  <Button
                    key={age.value}
                    onClick={() => handleFilterChange("ageRange", age.value)}
                    className={cn(
                      "text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all",
                      age.class,
                      state.filters.ageRange === age.value ? "ring-2 ring-white" : ""
                    )}
                  >
                    {age.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700 mb-3 block">Tipo de producto:</span>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleFilterChange("type", "physical")}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all",
                    state.filters.type === "physical"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Package className="w-4 h-4" />
                  <span>Físicos</span>
                </Button>
                <Button
                  onClick={() => handleFilterChange("type", "digital")}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all",
                    state.filters.type === "digital"
                      ? "bg-sky text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Digitales</span>
                </Button>
              </div>
            </div>

            {(state.filters.ageRange || state.filters.type || state.searchQuery) && (
              <div className="pt-4 border-t">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">
              No se encontraron productos que coincidan con tus filtros
            </p>
            <Button onClick={clearFilters} className="btn-gradient text-white">
              Ver todos los productos
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Mostrando {filtered.length} de {products.length} productos
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
