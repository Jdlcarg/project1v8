import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Product } from "@shared/schema";
import { Star, Check } from "lucide-react";

export default function Home() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const featuredProducts = products.slice(0, 3);

  const testimonials = [
    {
      name: "Ana Martínez",
      role: "Mamá de Mateo (7 años)",
      content: "Los juegos han ayudado enormemente a mi hijo con sus dificultades de atención. Ahora puede concentrarse mucho mejor en sus tareas escolares.",
      initial: "A",
      gradient: "from-mint to-sky"
    },
    {
      name: "Carlos Rodríguez", 
      role: "Papá de Sofía (10 años)",
      content: "La profesionalidad de María y la calidad de sus materiales es excepcional. Mi hija ha mejorado notablemente su autoestima.",
      initial: "C",
      gradient: "from-coral to-violet"
    },
    {
      name: "Laura Fernández",
      role: "Mamá de Franco y Valentina (5 años)",
      content: "Recomiendo totalmente estos productos. Son educativos, divertidos y han sido clave en el desarrollo de nuestros mellizos.",
      initial: "L",
      gradient: "from-soft-yellow to-mint"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-bg min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full bounce-gentle"></div>
          <div className="absolute top-40 right-40 w-20 h-20 bg-soft-yellow rounded-full pulse-soft"></div>
          <div className="absolute bottom-32 left-32 w-24 h-24 bg-coral rounded-full bounce-gentle"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-slide-in-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Juegos que 
                <span className="text-soft-yellow"> Educan</span> y
                <span className="text-coral"> Transforman</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Herramientas psicopedagógicas especializadas para potenciar el desarrollo cognitivo, emocional y social de niños y adolescentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/products">
                  <Button className="btn-gradient text-white px-8 py-4 rounded-xl font-semibold text-lg">
                    Explorar Productos
                  </Button>
                </Link>
                <Link href="/about">
                  <Button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transition-all">
                    Conocer Profesional
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-white/80 text-sm">Familias Atendidas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">15+</div>
                  <div className="text-white/80 text-sm">Años Experiencia</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-white/80 text-sm">Satisfacción</div>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block animate-slide-in-right">
              <img
                src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
                alt="Niños aprendiendo de forma lúdica con materiales educativos coloridos"
                className="rounded-3xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Productos Destacados</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros productos más populares diseñados para estimular el desarrollo integral
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/products">
              <Button className="btn-gradient text-white px-8 py-4 rounded-xl font-semibold text-lg">
                Ver Todos los Productos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Lo que dicen las familias</h2>
            <p className="text-xl text-gray-600">Testimonios reales de padres satisfechos</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg animate-fade-in">
                <div className="flex items-center mb-4">
                  <div className="flex text-soft-yellow">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className={`w-10 h-10 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {testimonial.initial}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-mint to-sky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para transformar el aprendizaje?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a cientos de familias que ya confían en nuestros productos educativos especializados
          </p>
          <Link href="/products">
            <Button className="bg-white text-mint px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300">
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
