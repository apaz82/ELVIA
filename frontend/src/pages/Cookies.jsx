// Política de Cookies — ELVIA
import { Link } from 'react-router-dom'
import { ArrowLeft, Cookie } from '@phosphor-icons/react'

const SECCIONES = [
  {
    num: '1',
    titulo: '¿Qué son las cookies?',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (computadora, teléfono móvil, tableta o navegador) cuando visitas un sitio web.
        </p>
        <p>
          Las cookies ayudan a los sitios web a:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Recordar tus preferencias.</li>
          <li>Mantener tu sesión iniciada.</li>
          <li>Mejorar el rendimiento del sitio.</li>
          <li>Entender el comportamiento de los visitantes.</li>
          <li>Personalizar contenido y experiencias.</li>
          <li>Medir la efectividad de la publicidad.</li>
          <li>Mejorar la seguridad y prevención de fraudes.</li>
        </ul>
        <p>
          También podemos utilizar tecnologías similares como píxeles, etiquetas, almacenamiento local, scripts y SDKs.
        </p>
      </div>
    ),
  },
  {
    num: '2',
    titulo: 'Cookies estrictamente necesarias',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          Estas cookies son esenciales para que los Servicios funcionen correctamente y normalmente no pueden desactivarse en nuestros sistemas. Se utilizan para:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Inicio de sesión y autenticación de cuenta.</li>
          <li>Seguridad y prevención de fraudes.</li>
          <li>Gestión de sesiones y balanceo de carga.</li>
          <li>Almacenamiento de preferencias de privacidad.</li>
        </ul>
        <p className="italic text-xs text-gray-500">Sin estas cookies, algunas partes de ELVIA podrían no funcionar correctamente.</p>
      </div>
    ),
  },
  {
    num: '3',
    titulo: 'Cookies de rendimiento y analítica',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          Estas cookies nos ayudan a entender cómo los visitantes utilizan nuestros Servicios para que podamos mejorar la usabilidad y el rendimiento. Pueden recopilar:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Visitas a páginas y fuentes de tráfico.</li>
          <li>Información del dispositivo y navegador.</li>
          <li>Tiempo en el sitio y comportamiento de clics.</li>
          <li>Informes de errores.</li>
        </ul>
        <p>Ejemplos incluyen Google Analytics y herramientas similares. Los datos suelen estar agregados o seudonimizados.</p>
      </div>
    ),
  },
  {
    num: '4',
    titulo: 'Cookies funcionales',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          Estas cookies recuerdan las elecciones que realizas y mejoran la personalización. Ejemplos:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Configuración de idioma y preferencias de región.</li>
          <li>Entradas de formularios guardadas.</li>
          <li>Configuración de la interfaz de usuario.</li>
          <li>Preferencias de contenido.</li>
        </ul>
      </div>
    ),
  },
  {
    num: '5',
    titulo: 'Cookies de publicidad y marketing',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          Estas cookies ayudan a ofrecer marketing más relevante y medir el rendimiento de las campañas. Se pueden utilizar para:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Mostrar anuncios relevantes.</li>
          <li>Limitar anuncios repetidos.</li>
          <li>Medir conversiones.</li>
          <li>Crear segmentos de audiencia.</li>
          <li>Reimpactar (retargeting) a los visitantes a través de plataformas.</li>
        </ul>
        <p>Ejemplos incluyen píxeles de LinkedIn Ads, Meta/Facebook y herramientas de Google Ads.</p>
      </div>
    ),
  },
  {
    num: '6',
    titulo: 'Cookies de terceros',
    contenido: (
      <p className="text-sm text-gray-600 leading-relaxed">
        Algunas cookies son colocadas por proveedores externos que realizan servicios para nosotros o operan herramientas integradas en ELVIA, como procesadores de pago, plataformas de análisis o servicios de alojamiento de video. No controlamos todas las tecnologías de terceros; su uso se rige por sus propias políticas de privacidad y cookies.
      </p>
    ),
  },
  {
    num: '7',
    titulo: 'Duración de las cookies',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>
          <strong className="text-gray-800">Cookies de sesión:</strong> Cookies temporales que expiran cuando cierras tu navegador.
        </p>
        <p>
          <strong className="text-gray-800">Cookies persistentes:</strong> Permanecen en tu dispositivo hasta que expiran automáticamente o las eliminas. Los periodos de retención varían según el propósito y el proveedor.
        </p>
      </div>
    ),
  },
  {
    num: '8',
    titulo: 'Base legal para el uso de cookies',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>Donde las leyes aplicables lo requieren (como GDPR y leyes locales), nos basamos en:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-gray-700">Consentimiento:</strong> para cookies no esenciales.</li>
          <li><strong className="text-gray-700">Interés legítimo o necesidad:</strong> para cookies esenciales.</li>
          <li><strong className="text-gray-700">Necesidad contractual:</strong> cuando sea necesario para proporcionar los servicios solicitados.</li>
        </ul>
      </div>
    ),
  },
  {
    num: '9',
    titulo: 'Cómo gestionar las cookies',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Puedes controlar las cookies a través del banner de consentimiento que aparece al visitar ELVIA por primera vez, donde puedes aceptar todas, rechazar las no esenciales o personalizar tus preferencias.</p>
        <p>También puedes gestionarlas a través de la configuración de tu navegador (Chrome, Safari, Firefox, Edge), donde puedes bloquearlas, eliminarlas o recibir alertas. Ten en cuenta que desactivar las cookies puede afectar la funcionalidad de la plataforma.</p>
      </div>
    ),
  },
  {
    num: '10',
    titulo: 'Cambios a esta política',
    contenido: (
      <p className="text-sm text-gray-600">
        Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios legales, técnicos o comerciales. Cuando se realicen actualizaciones, revisaremos la fecha de "Última actualización".
      </p>
    ),
  },
  {
    num: '11',
    titulo: 'Contacto',
    contenido: (
      <div className="space-y-1 text-sm text-gray-600">
        <p>Si tienes preguntas sobre esta Política de Cookies o tus opciones de privacidad, contáctanos:</p>
        <p><strong className="text-gray-800">Correo electrónico:</strong> soporte@elvia.lat</p>
        <p><strong className="text-gray-800">Sitio web:</strong> www.elvia.lat</p>
      </div>
    ),
  },
]

export default function Cookies() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={16} weight="bold" />
            Volver al inicio
          </Link>
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-9 w-auto object-contain" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full mb-4">
            <Cookie size={18} weight="duotone" className="text-amber-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Política de Cookies</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Política de Cookies</h1>
          <p className="text-sm text-gray-500">Última actualización: 03/05/2026</p>
        </div>

        {/* Introducción */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">
            Esta Política de Cookies explica cómo <strong className="text-gray-900">ELVIA</strong> ("nosotros") utiliza cookies y tecnologías similares cuando visitas nuestro sitio web y plataformas conectadas. Esta política debe leerse junto con nuestra Política de Privacidad y nuestros Términos de Uso.
          </p>
        </div>

        {/* Secciones */}
        <div className="space-y-4">
          {SECCIONES.map(({ num, titulo, contenido }) => (
            <div key={num} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold shrink-0">
                  {num}
                </span>
                <h2 className="font-bold text-gray-900">{titulo}</h2>
              </div>
              <div className="px-6 py-5">
                {contenido}
              </div>
            </div>
          ))}
        </div>

        {/* Footer del documento */}
        <div className="mt-10 text-center text-xs text-gray-400 border-t border-gray-200 pt-6">
          <p>© {new Date().getFullYear()} ELVIA · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  )
}
