import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTitle } from "@/hooks/useTitle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Camera,
  ShoppingBag,
  Heart,
  Truck,
  Search,
  Download,
  MessageSquare,
  Settings,
  Package,
  Clock,
  CheckCircle,
  Filter,
  Star,
  AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";


interface UpdateProfileData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'processing' | 'preparing' | 'shipped' | 'delivered';
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  tracking?: string;
}

interface SupportTicket {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  date: string;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  joinDate: string;
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  useTitle("Mi Perfil - EduJuegos");

  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [orderSearch, setOrderSearch] = useState("");
  const [supportForm, setSupportForm] = useState({
    type: "",
    subject: "",
    description: "",
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Mock data - replace with real API calls
  const [userStats] = useState<UserStats>({
    totalOrders: 12,
    totalSpent: 156800,
    favoriteProducts: 8,
    joinDate: "2024-01-15"
  });

  const [orders] = useState<Order[]>([
    {
      id: "ORD-2024-001",
      date: "2024-01-20",
      total: 35800,
      status: "delivered",
      items: [
        { id: "1", name: "Set Educativo Completo", price: 35800, quantity: 1, image: "/placeholder-product.jpg" }
      ],
      tracking: "AR123456789"
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-18",
      total: 18500,
      status: "shipped",
      items: [
        { id: "2", name: "Kit de Aprendizaje", price: 18500, quantity: 1, image: "/placeholder-product.jpg" }
      ],
      tracking: "AR987654321"
    }
  ]);

  const [supportTickets] = useState<SupportTicket[]>([
    {
      id: "TKT-001",
      type: "Problema con pedido",
      subject: "Consulta sobre envío",
      description: "Necesito información sobre el estado de mi pedido",
      status: "resolved",
      date: "2024-01-15"
    }
  ]);

  // Initialize profile data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        updateProfile(data.user);
        toast({
          title: "Perfil actualizado",
          description: "Tu perfil ha sido actualizado exitosamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Error al actualizar perfil",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al actualizar perfil",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Error al cambiar contraseña",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de conexión al cambiar contraseña",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupport(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Consulta enviada",
        description: "Tu consulta ha sido enviada. Te contactaremos pronto.",
      });

      setSupportForm({
        type: "",
        subject: "",
        description: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al enviar la consulta",
      });
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      processing: "secondary",
      preparing: "outline",
      shipped: "default",
      delivered: "default"
    } as const;

    const labels = {
      processing: "Procesando",
      preparing: "En preparación",
      shipped: "Enviado",
      delivered: "Entregado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    order.items.some(item => item.name.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Seguimiento
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Soporte
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favoritos
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.totalOrders}</p>
                    <p className="text-sm text-gray-600">Pedidos realizados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${userStats.totalSpent.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total gastado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.favoriteProducts}</p>
                    <p className="text-sm text-gray-600">Productos favoritos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {new Date(userStats.joinDate).getFullYear()}
                    </p>
                    <p className="text-sm text-gray-600">Cliente desde</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-lg">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Cambiar foto
                  </Button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        placeholder="+54 11 1234-5678"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="address"
                        type="text"
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({ ...profileData, address: e.target.value })
                        }
                        placeholder="Tu dirección completa"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar Perfil"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Cambiar Contraseña
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Tu contraseña actual"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Tu nueva contraseña"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirma tu nueva contraseña"
                      minLength={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full"
                    variant="outline"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      "Cambiar Contraseña"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pedidos</CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número de pedido o producto..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{order.id}</h3>
                          <p className="text-gray-600">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${order.total.toLocaleString()}</p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Descargar factura
                        </Button>
                        <Button variant="outline" size="sm">
                          Reordenar
                        </Button>
                        {order.tracking && (
                          <Button variant="outline" size="sm">
                            <Truck className="w-4 h-4 mr-2" />
                            Rastrear: {order.tracking}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Ingresa el número de pedido..."
                    className="pl-10"
                  />
                </div>

                {orders.map((order) => (
                  <Card key={order.id} className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-semibold text-lg">{order.id}</h3>
                          <p className="text-gray-600">
                            Pedido realizado el {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Progress Timeline */}
                      <div className="space-y-4">
                        {['processing', 'preparing', 'shipped', 'delivered'].map((status, index) => {
                          const isCompleted = ['processing', 'preparing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                          const isCurrent = order.status === status;

                          return (
                            <div key={status} className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-500 text-white' :
                                isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {getStatusIcon(status)}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {status === 'processing' && 'Procesando pedido'}
                                  {status === 'preparing' && 'Preparando envío'}
                                  {status === 'shipped' && 'En camino'}
                                  {status === 'delivered' && 'Entregado'}
                                </p>
                                {isCurrent && (
                                  <p className="text-sm text-blue-600">Estado actual</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {order.tracking && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-900">Código de seguimiento:</p>
                          <p className="text-blue-700 font-mono">{order.tracking}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* New Support Request */}
            <Card>
              <CardHeader>
                <CardTitle>Nueva Consulta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="supportType">Tipo de consulta</Label>
                    <Select value={supportForm.type} onValueChange={(value) =>
                      setSupportForm({ ...supportForm, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Problema con pedido</SelectItem>
                        <SelectItem value="product">Consulta de producto</SelectItem>
                        <SelectItem value="complaint">Reclamo</SelectItem>
                        <SelectItem value="suggestion">Sugerencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      value={supportForm.subject}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, subject: e.target.value })
                      }
                      placeholder="Describe brevemente tu consulta"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={supportForm.description}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, description: e.target.value })
                      }
                      placeholder="Describe detalladamente tu consulta o problema"
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingSupport}
                    className="w-full"
                  >
                    {isSubmittingSupport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Consulta"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support History */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{ticket.subject}</h4>
                          <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                            {ticket.status === 'open' && 'Abierto'}
                            {ticket.status === 'in-progress' && 'En progreso'}
                            {ticket.status === 'resolved' && 'Resuelto'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ticket.type}</p>
                        <p className="text-sm">{ticket.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(ticket.date).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Productos Favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No tienes productos favoritos aún
                </h3>
                <p className="text-gray-500 mb-4">
                  Explora nuestros productos y agrégalos a favoritos
                </p>
                <Button onClick={() => navigate("/products")}>
                  Ver Productos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Notificaciones por email</p>
                      <p className="text-sm text-gray-600">Recibir actualizaciones de pedidos</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Ofertas y promociones</p>
                      <p className="text-sm text-gray-600">Recibir ofertas especiales</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Privacidad</p>
                      <p className="text-sm text-gray-600">Perfil público</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Eliminar cuenta</p>
                        <p className="text-sm text-red-600">
                          Esta acción no se puede deshacer. Se eliminarán tus datos.
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" className="mt-3">
                      Eliminar cuenta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID de Usuario</Label>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">{user.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Rol</Label>
                  <p className="capitalize font-medium">{user.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Miembro desde</Label>
                  <p className="font-medium">
                    {new Date(userStats.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}