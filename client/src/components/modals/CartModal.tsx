import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Product } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "wouter";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, updateQuantity, removeFromCart, getCartTotal, getCartItemsWithProducts } = useCart();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const cartItems = getCartItemsWithProducts(products);
  const total = getCartTotal(products);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby="cart-description">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Tu Carrito</DialogTitle>
            <p id="cart-description" className="sr-only">Gestiona los productos en tu carrito de compras</p>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden" aria-describedby="cart-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Tu Carrito</DialogTitle>
          <p id="cart-description" className="sr-only">Gestiona los productos en tu carrito de compras</p>
        </DialogHeader>

        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
            <Button onClick={onClose} className="btn-gradient text-white">
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center space-x-4 py-4 border-b">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 bg-gray-200 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.ageRange} años</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-mint">{formatPrice(product.price)}</p>
                    <div className="flex items-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="mx-3 font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(product.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-mint">{formatPrice(total.toString())}</span>
              </div>
              <Link href="/checkout" onClick={onClose}>
                <Button className="w-full btn-gradient text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300">
                  Proceder al Checkout
                </Button>
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}