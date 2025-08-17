import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterUser) => 
      apiRequest("POST", "/api/auth/register", userData),
    onSuccess: () => {
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.",
      });
      form.reset();
      onClose();
      onSwitchToLogin();
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrarse",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterUser) => {
    registerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]" aria-describedby="register-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <UserPlus className="h-5 w-5" />
            Crear cuenta
          </DialogTitle>
          <p id="register-description" className="sr-only">Crea una nueva cuenta para acceder a todos los productos</p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              data-testid="input-name"
              placeholder="Tu nombre completo"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="input-email"
              type="email"
              placeholder="tu@email.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                {...form.register("password")}
              />
              <button
                type="button"
                data-testid="button-toggle-password"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                data-testid="button-toggle-confirm-password"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            data-testid="button-register"
            disabled={registerMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {registerMutation.isPending ? "Registrando..." : "Crear cuenta"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                data-testid="link-switch-to-login"
                onClick={onSwitchToLogin}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}