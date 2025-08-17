import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const recoverySchema = z.object({
  email: z.string().email("Email inválido"),
});

const resetSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RecoveryForm = z.infer<typeof recoverySchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"login" | "recovery" | "reset">("login");
  const [email, setEmail] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        reset();
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.message || "Credenciales inválidas",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerRecovery,
    handleSubmit: handleSubmitRecovery,
    formState: { errors: recoveryErrors },
    reset: resetRecovery,
  } = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    reset: resetResetForm,
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const requestRecoveryMutation = useMutation({
    mutationFn: async (data: RecoveryForm) => {
      const response = await apiRequest("POST", "/api/auth/password-recovery", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email enviado",
        description: "Se ha enviado un email con instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.",
      });
      setEmail(data.email);
      // NO cambiar a reset automáticamente - el usuario debe usar el link del email
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al enviar email de recuperación",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetForm) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar contraseña",
        variant: "destructive",
      });
    },
  });



  const onRequestRecovery = (data: RecoveryForm) => {
    requestRecoveryMutation.mutate(data);
  };

  const onResetPassword = (data: ResetForm) => {
    resetPasswordMutation.mutate(data);
  };

  const handleClose = () => {
    setView("login");
    setEmail("");
    reset();
    resetRecovery();
    resetResetForm();
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]" aria-describedby="modal-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {view !== "login" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("login")}
                className="flex items-center space-x-1 text-mint hover:text-mint/80"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
            )}
            <DialogTitle className="flex-1 text-center">
              {view === "login" && "Iniciar Sesión"}
              {view === "recovery" && "Recuperar Contraseña"}
              {view === "reset" && "Nueva Contraseña"}
            </DialogTitle>
            {view !== "login" && <div className="w-16" />}
          </div>
          <p id="modal-description" className="sr-only">
            {view === "login" && "Accede a tu cuenta para realizar compras"}
            {view === "recovery" && "Ingresa tu email para recibir instrucciones"}
            {view === "reset" && "Ingresa el token recibido y tu nueva contraseña"}
          </p>
        </DialogHeader>

        {view === "login" && (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@test.com"
                  {...register("email")}
                  className="w-full"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="admin123"
                  {...register("password")}
                  className="w-full"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Iniciando sesión...
                  </div>
                ) : (
                  "Ingresar"
                )}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setView("recovery")}
                  className="text-mint hover:text-mint/80 text-sm"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>

            <div className="pt-6 border-t space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    data-testid="link-switch-to-register"
                    onClick={onSwitchToRegister}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Admin demo: admin@test.com / admin123</p>
              </div>
            </div>
          </>
        )}

        {view === "recovery" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-mint" />
                </div>
                <p className="text-gray-600">
                  Ingresa tu email para recibir un link de recuperación
                </p>
              </div>

              <form onSubmit={handleSubmitRecovery(onRequestRecovery)} className="space-y-4">
                <div>
                  <Label htmlFor="recovery-email">Email</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    {...registerRecovery("email")}
                    placeholder="tu@email.com"
                  />
                  {recoveryErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{recoveryErrors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={requestRecoveryMutation.isPending}
                  className="w-full btn-gradient text-white"
                >
                  {requestRecoveryMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Enviando...
                    </div>
                  ) : (
                    "Enviar Link de Recuperación"
                  )}
                </Button>
              </form>
            </div>
          )}

        
      </DialogContent>
    </Dialog>
  );
}