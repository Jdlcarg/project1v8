import { Check } from "lucide-react";

export default function About() {
  const qualifications = [
    {
      title: "Formación Académica",
      description: "Universidad de Buenos Aires - Licenciatura en Psicopedagogía",
      color: "mint"
    },
    {
      title: "Especialización",
      description: "Terapia Cognitivo-Conductual Infantil y Adolescente",
      color: "sky"
    },
    {
      title: "Certificaciones",
      description: "Certificada en Juego Terapéutico y Estimulación Temprana",
      color: "coral"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-in-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Lic. María González</h1>
            <p className="text-lg text-gray-600 mb-6">
              Licenciada en Psicopedagogía con más de 15 años de experiencia especializada en el desarrollo cognitivo, emocional y social de niños y adolescentes.
            </p>
            
            <div className="space-y-4 mb-8">
              {qualifications.map((qual, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-6 h-6 bg-${qual.color} rounded-full flex items-center justify-center mt-1`}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{qual.title}</h4>
                    <p className="text-gray-600">{qual.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center bg-white rounded-xl p-4 shadow-lg">
                <div className="text-3xl font-bold text-mint mb-1">500+</div>
                <div className="text-sm text-gray-600">Familias Atendidas</div>
              </div>
              <div className="text-center bg-white rounded-xl p-4 shadow-lg">
                <div className="text-3xl font-bold text-sky mb-1">15+</div>
                <div className="text-sm text-gray-600">Años de Experiencia</div>
              </div>
            </div>
          </div>
          
          <div className="text-center animate-slide-in-right">
            <img
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800"
              alt="Licenciada en Psicopedagogía María González en consulta profesional"
              className="rounded-3xl shadow-2xl w-full h-auto max-w-md mx-auto"
            />
          </div>
        </div>

        {/* Mission and Vision */}
        <div className="mt-20 grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Mi Misión</h3>
            <p className="text-gray-600 leading-relaxed">
              Acompañar a niños, niñas y adolescentes en su proceso de desarrollo integral, brindando herramientas especializadas y metodologías innovadoras que potencien sus habilidades cognitivas, emocionales y sociales a través del juego terapéutico.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Mi Visión</h3>
            <p className="text-gray-600 leading-relaxed">
              Ser referente en psicopedagogía infantil y adolescente en Argentina, transformando vidas a través de intervenciones personalizadas y productos educativos de calidad que marquen una diferencia real en el desarrollo de cada niño.
            </p>
          </div>
        </div>

        {/* Approach */}
        <div className="mt-20 bg-gradient-to-r from-mint to-sky rounded-2xl p-8 text-white">
          <h3 className="text-3xl font-bold mb-6 text-center">Mi Enfoque Terapéutico</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="font-semibold mb-2">Desarrollo Cognitivo</h4>
              <p className="text-white/90 text-sm">
                Estimulación de funciones ejecutivas, memoria, atención y procesamiento de información
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❤️</span>
              </div>
              <h4 className="font-semibold mb-2">Inteligencia Emocional</h4>
              <p className="text-white/90 text-sm">
                Desarrollo de habilidades para reconocer, comprender y gestionar emociones propias y ajenas
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h4 className="font-semibold mb-2">Habilidades Sociales</h4>
              <p className="text-white/90 text-sm">
                Fortalecimiento de la comunicación, empatía y competencias para la interacción social exitosa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
