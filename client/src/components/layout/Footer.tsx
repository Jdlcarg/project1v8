import { Brain, Instagram, Facebook, Linkedin, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-mint to-sky rounded-xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">EduJuegos</h1>
                <p className="text-gray-400">Lic. María González</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Especialista en psicopedagogía con 15+ años de experiencia. Comprometida con el desarrollo integral de niños y adolescentes a través de herramientas lúdicas y educativas.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gradient-to-br from-mint to-sky rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gradient-to-br from-mint to-sky rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gradient-to-br from-mint to-sky rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-mint" />
                <span className="text-gray-300">+54 11 1234-5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-mint" />
                <span className="text-gray-300">maria@edujuegos.com.ar</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-mint" />
                <span className="text-gray-300">Buenos Aires, Argentina</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
            <div className="space-y-2">
              <a href="/" className="block text-gray-300 hover:text-mint transition-colors">
                Inicio
              </a>
              <a href="/products" className="block text-gray-300 hover:text-mint transition-colors">
                Productos
              </a>
              <a href="/about" className="block text-gray-300 hover:text-mint transition-colors">
                Sobre Mí
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2024 EduJuegos - Lic. María González. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-mint text-sm transition-colors">
                Términos y Condiciones
              </a>
              <a href="#" className="text-gray-400 hover:text-mint text-sm transition-colors">
                Política de Privacidad
              </a>
            </div>
          </div>
          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-gray-500 text-xs">
              Desarrollado por{" "}
              <a 
                href="https://www.softwarepar.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-mint hover:text-sky transition-colors font-medium"
              >
                SoftwarePar
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
