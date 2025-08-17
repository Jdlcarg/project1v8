import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";

const recoverySchema = z.object({
  email: z.string().email("Email inválido"),
});

const resetSchema = z.object({
  token: z.string().optional(),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RecoveryForm = z.infer<typeof recoverySchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function PasswordRecovery() {
  const { toast } = useToast();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [urlToken, setUrlToken] = useState("");

  // Check for token in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setUrlToken(token);
      setStep("reset");
    } else {
      setStep("request");
    }
  }, []);

  const {
    register: registerRecovery,
    handleSubmit: handleSubmitRecovery,
    formState: { errors: recoveryErrors },
  } = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    setError,
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
        title: "✅ Email enviado exitosamente",
        description: "Revisa tu bandeja de entrada y haz clic en el link para recuperar tu contraseña. El link expira en 1 hora.",
      });
      setEmail(data.email);
      // NO cambiar automáticamente a reset - solo por URL token
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
      window.location.href = "/";
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
    // Use URL token if available, otherwise use form token
    const tokenToUse = urlToken || data.token;

    if (!tokenToUse) {
      setError("token", { message: "Token requerido" });
      return;
    }

    resetPasswordMutation.mutate({
      ...data,
      token: tokenToUse
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="flex items-center space-x-2 text-mint hover:text-mint/80">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-mint" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {step === "request" ? "Recuperar Contraseña" : "Nueva Contraseña"}
            </CardTitle>
            <p className="text-gray-600">
              {step === "request"
                ? "Ingresa tu email para recibir instrucciones"
                : "Ingresa el token recibido y tu nueva contraseña"
              }
            </p>
          </CardHeader>
          <CardContent>
            {step === "request" ? (
              <>
                {!requestRecoveryMutation.isSuccess ? (
                  <form onSubmit={handleSubmitRecovery(onRequestRecovery)} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
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
                        "Enviar Email de Recuperación"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Email Enviado</h3>
                      <p className="text-gray-600 mb-4">
                        Se ha enviado un email con instrucciones a{" "}
                        <span className="font-semibold text-mint">{email}</span>
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <p className="text-blue-800 text-sm">
                          <strong>Próximos pasos:</strong>
                        </p>
                        <ul className="text-blue-700 text-sm mt-2 space-y-1">
                          <li>• Revisa tu bandeja de entrada</li>
                          <li>• Busca el email de EduJuegos</li>
                          <li>• Haz clic en el link del email</li>
                          <li>• El link expira en 1 hora</li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        requestRecoveryMutation.reset();
                        setEmail("");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Enviar a otro email
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-4">
                {!urlToken && (
                  <div>
                    <Label htmlFor="token">Token de Recuperación</Label>
                    <Input
                      id="token"
                      {...registerReset("token")}
                      placeholder="Token recibido por email"
                    />
                    {resetErrors.token && (
                      <p className="text-red-500 text-sm mt-1">{resetErrors.token.message}</p>
                    )}
                  </div>
                )}

                {urlToken && (
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium">✓ Link de recuperación válido</p>
                    <p className="text-green-600 text-sm">Ingresa tu nueva contraseña a continuación</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerReset("newPassword")}
                    placeholder="Nueva contraseña"
                  />
                  {resetErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{resetErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerReset("confirmPassword")}
                    placeholder="Confirma tu contraseña"
                  />
                  {resetErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{resetErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full btn-gradient text-white"
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Actualizando...
                    </div>
                  ) : (
                    "Actualizar Contraseña"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("request")}
                  className="w-full"
                >
                  Solicitar nuevo token
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}