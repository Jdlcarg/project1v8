import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AgeBadge } from "@/components/ui/age-badge";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Package, Smartphone } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Producto agregado",
      description: `${product.name} fue agregado al carrito`,
    });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const isOutOfStock = product.type === "physical" && product.stock !== null && product.stock <= 0;

  return (
    <Card className="bg-white rounded-2xl shadow-lg card-hover overflow-hidden animate-fade-in">
      <div className="relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <AgeBadge ageRange={product.ageRange} />
        </div>
        <div className="absolute top-4 right-4">
          <Badge
            variant="secondary"
            className={cn(
              "text-white font-medium flex items-center gap-1",
              product.type === "physical" ? "bg-orange-500" : "bg-sky"
            )}
          >
            {product.type === "physical" ? (
              <>
                <Package className="w-3 h-3" />
                Físico
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3" />
                Digital
              </>
            )}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-mint">{formatPrice(product.price)}</span>
          {product.type === "physical" ? (
            <span className={cn(
              "text-sm font-medium",
              isOutOfStock ? "text-red-600" : "text-gray-500"
            )}>
              {isOutOfStock ? "Sin stock" : `Stock: ${product.stock}`}
            </span>
          ) : (
            <span className="text-sm text-green-600 font-medium">Descarga inmediata</span>
          )}
        </div>
        
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full btn-gradient text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
        >
          {isOutOfStock ? "Sin stock" : "Agregar al Carrito"}
        </Button>
      </CardContent>
    </Card>
  );
}
