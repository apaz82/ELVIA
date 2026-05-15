// Política de Privacidad y Tratamiento de Datos — ELVIA
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react'

const SECCIONES = [
  {
    num: '1',
    titulo: 'Responsable del tratamiento de datos',
    contenido: (
      <div className="space-y-1 text-sm text-gray-600">
        <p><strong className="text-gray-800">Empresa:</strong> Elvia SA de CV</p>
        <p><strong className="text-gray-800">Domicilio:</strong> Chicontepec 57</p>
        <p><strong className="text-gray-800">Correo de privacidad:</strong> privacidad@elvia.lat</p>
        <p><strong className="text-gray-800">Sitio web:</strong> www.elvia.lat</p>
      </div>
    ),
  },
  {
    num: '2',
    titulo: 'Datos personales que recopilamos',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Al usar ELVIA recopilamos las siguientes categorías de datos:</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700 w-1/3">Tipo de datos</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Datos de identidad', 'Cargo, nombre, apellidos, fecha de nacimiento, sexo, fotografía, nacionalidad, estado civil y datos de residencia.'],
                ['Datos de contacto', 'Dirección física y electrónica, números de teléfono y datos de contacto en caso de emergencia.'],
                ['Datos históricos', 'Historial educativo, credenciales, historial de empleo, habilidades y cualificaciones.'],
                ['Datos relativos al empleo', 'Remuneración actual, puesto buscado, áreas de interés y comentarios de evaluación.'],
                ['Datos de pago', 'Información de facturación (nombre y dirección fiscal). Los datos de tarjeta son procesados directamente por el proveedor de pagos; nosotros no los almacenamos.'],
                ['Datos técnicos', 'Dirección IP, tipo y versión de navegador, sistema operativo y datos de ubicación.'],
                ['Datos de uso', 'Cómo utilizas, interactúas y navegas por nuestros sitios web.'],
                ['Datos comerciales', 'Preferencias de comunicación e información comercial.'],
              ].map(([tipo, desc]) => (
                <tr key={tipo} className="even:bg-gray-50/50">
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 align-top">{tipo}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="italic text-gray-500 text-xs">No recopilamos datos sensibles como origen racial, estado de salud, creencias religiosas o datos biométricos.</p>
      </div>
    ),
  },
  {
    num: '3',
    titulo: 'Finalidad del tratamiento',
    contenido: (
      <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
        {[
          'Prestación del servicio: optimizar, reformatear y generar tu currículum mediante inteligencia artificial.',
          'Gestión de cuenta: crear y administrar tu perfil, autenticación y recuperación de contraseña.',
          'Procesamiento de pagos: gestionar suscripciones, cobros y facturación de los planes contratados.',
          'Comunicaciones transaccionales: confirmaciones de pago, actualizaciones del servicio y notificaciones de seguridad.',
          'Mejora del servicio: analizar patrones de uso de forma agregada y anonimizada.',
          'Marketing (solo con consentimiento previo y expreso): información sobre nuevas funcionalidades u ofertas. Puedes revocar este consentimiento en cualquier momento.',
        ].map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    ),
  },
  {
    num: '4',
    titulo: 'Base legal del tratamiento',
    contenido: (
      <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
        {[
          'Ejecución del contrato de servicio que aceptas al registrarte.',
          'Consentimiento expreso que otorgas al subir tu CV y al aceptar esta política.',
          'Interés legítimo de ELVIA para operar y mejorar la plataforma.',
          'Cumplimiento de obligaciones legales aplicables.',
        ].map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    ),
  },
  {
    num: '5',
    titulo: 'Procesamiento mediante inteligencia artificial',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-xl">
          <p className="font-semibold text-blue-700 text-xs uppercase tracking-wide mb-1">Sección relevante</p>
          <p>Al subir tu CV, su contenido es procesado por modelos de inteligencia artificial para brindarte el servicio.</p>
        </div>
        <p>Al respecto, ELVIA garantiza que:</p>
        <ul className="space-y-1.5 list-disc pl-5">
          {[
            'Tu CV se procesa con el único propósito de brindarte el servicio solicitado.',
            'No utilizamos el contenido de tu CV para entrenar modelos de IA propios sin tu consentimiento explícito.',
            'Los proveedores de IA están sujetos a acuerdos de confidencialidad y solo procesan los datos para prestar el servicio.',
            'Las decisiones automatizadas que afecten significativamente tus derechos son susceptibles de revisión humana a tu solicitud.',
          ].map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    ),
  },
  {
    num: '6',
    titulo: 'Datos de pago',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>ELVIA no almacena datos de tarjetas de crédito o débito en sus propios servidores. Los pagos son procesados por proveedores certificados bajo el estándar PCI DSS. Solo conservamos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>El historial de transacciones (fecha, monto, plan) para efectos de facturación y cumplimiento fiscal.</li>
          <li>Los últimos cuatro dígitos del instrumento de pago y su tipo, como referencia para el usuario.</li>
        </ul>
      </div>
    ),
  },
  {
    num: '7',
    titulo: 'Transferencia y comunicación de datos a terceros',
    contenido: (
      <div className="space-y-2 text-sm text-gray-600">
        <p>No vendemos ni alquilamos tus datos personales a terceros. Podemos compartir datos únicamente en los siguientes supuestos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-gray-700">Proveedores de servicios:</strong> empresas que nos asisten en la operación (hosting, IA, pagos, correo transaccional), sujetos a contratos de confidencialidad.</li>
          <li><strong className="text-gray-700">Obligación legal:</strong> cuando sea requerido por autoridad competente mediante mandamiento judicial o administrativo debidamente fundado.</li>
          <li><strong className="text-gray-700">Consentimiento del titular:</strong> en cualquier otro caso, previa autorización expresa tuya.</li>
        </ul>
        <p className="italic text-xs text-gray-500">Las transferencias internacionales de datos se realizan adoptando las medidas de seguridad adecuadas (cláusulas contractuales estándar o mecanismos equivalentes).</p>
      </div>
    ),
  },
  {
    num: '8',
    titulo: 'Conservación de los datos',
    contenido: (
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
        <li>Mientras mantengas tu cuenta activa: todos los datos de identidad, CV y uso.</li>
        <li>1 año adicional tras la cancelación de la cuenta: para atender posibles reclamaciones.</li>
        <li>5 años: datos de pago e historial de transacciones (obligación fiscal).</li>
      </ul>
    ),
  },
  {
    num: '9',
    titulo: 'Derechos del titular de los datos',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Dependiendo de tu país de residencia, tienes derecho a:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['Acceso (A)', 'Conocer qué datos tenemos sobre ti y cómo los usamos.'],
            ['Rectificación (R)', 'Corregir datos inexactos o incompletos.'],
            ['Cancelación / Supresión (C)', 'Solicitar la eliminación cuando ya no sean necesarios.'],
            ['Oposición (O)', 'Oponerte al tratamiento para fines específicos.'],
            ['Portabilidad', 'Recibir tus datos en formato estructurado y de uso común.'],
            ['Revocación del consentimiento', 'Retirar tu consentimiento en cualquier momento sin efecto retroactivo.'],
          ].map(([derecho, desc]) => (
            <div key={derecho} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="font-semibold text-teal-700 text-xs mb-1">{derecho}</p>
              <p className="text-xs text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="font-semibold text-amber-700 text-xs uppercase tracking-wide mb-1">¿Cómo ejercer tus derechos?</p>
          <p className="text-xs text-amber-800">Envía tu solicitud a <strong>privacidad@elvia.lat</strong> indicando: nombre completo, dato de contacto, copia de identificación oficial y descripción clara de tu solicitud. Responderemos en un plazo máximo de 20 días hábiles.</p>
        </div>
      </div>
    ),
  },
  {
    num: '10',
    titulo: 'Medidas de seguridad',
    contenido: (
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
        {[
          'Cifrado de comunicaciones mediante TLS/HTTPS.',
          'Almacenamiento de datos cifrado en reposo.',
          'Control de acceso basado en roles y mínimo privilegio.',
          'Autenticación segura con contraseñas cifradas (hashing).',
          'Auditorías de seguridad periódicas.',
          'Acuerdos de confidencialidad con todos los proveedores de servicios.',
        ].map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    ),
  },
  {
    num: '11',
    titulo: 'Menores de edad',
    contenido: (
      <p className="text-sm text-gray-600">ELVIA está dirigido a personas mayores de 18 años. No recopilamos de manera consciente datos de menores de edad. Si tienes conocimiento de que un menor nos ha proporcionado datos personales, contáctanos a <strong>privacidad@elvia.lat</strong> para proceder a su eliminación inmediata.</p>
    ),
  },
  {
    num: '12',
    titulo: 'Cambios a esta política',
    contenido: (
      <p className="text-sm text-gray-600">Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Cuando realicemos cambios materiales, lo notificaremos mediante aviso en la plataforma y/o correo electrónico con al menos 15 días de anticipación. El uso continuado del servicio tras la entrada en vigor implica la aceptación de los cambios.</p>
    ),
  },
  {
    num: '13',
    titulo: 'Legislación aplicable y autoridades de control',
    contenido: (
      <div className="space-y-3 text-sm text-gray-600">
        <p>Esta política cumple con los principios generales de protección de datos reconocidos en las principales legislaciones de América Latina:</p>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {[
            ['🇲🇽', 'México', 'LFPDPPP · Autoridad: INAI'],
            ['🇧🇷', 'Brasil', 'LGPD (Lei 13.709/2018) · Autoridad: ANPD'],
            ['🇦🇷', 'Argentina', 'Ley 25.326 · Autoridad: AAIP'],
            ['🇨🇴', 'Colombia', 'Ley 1581/2012 · Autoridad: SIC'],
            ['🇨🇱', 'Chile', 'Ley 19.628 · Autoridad: CPLT'],
            ['🇵🇪', 'Perú', 'Ley 29733 · Autoridad: ANPD'],
            ['🇺🇾', 'Uruguay', 'Ley 18.331 · Autoridad: URCDP'],
            ['🇵🇦', 'Panamá', 'Ley 81/2019'],
            ['🇨🇷', 'Costa Rica', 'Ley 8968'],
            ['🇪🇨', 'Ecuador', 'LOPDP (2021)'],
          ].map(([flag, pais, ley]) => (
            <div key={pais} className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-base">{flag}</span>
              <div>
                <p className="font-semibold text-gray-700">{pais}</p>
                <p className="text-gray-500">{ley}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: '14',
    titulo: 'Contacto y consultas',
    contenido: (
      <div className="space-y-1 text-sm text-gray-600">
        <p>Para cualquier duda, solicitud o reclamación relacionada con esta Política de Privacidad:</p>
        <p><strong className="text-gray-800">Correo electrónico:</strong> privacidad@elvia.lat</p>
        <p><strong className="text-gray-800">Domicilio:</strong> Chicontepec 57, México</p>
      </div>
    ),
  },
]

export default function Privacidad() {
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
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-2 rounded-full mb-4">
            <ShieldCheck size={18} weight="duotone" className="text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Privacidad y Datos</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Política de Privacidad y Tratamiento de Datos</h1>
          <p className="text-sm text-gray-500">Vigente desde: 25/03/2026 · Última actualización: 25/03/2026</p>
        </div>

        {/* Introducción */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">
            En <strong className="text-gray-900">ELVIA</strong> ("la Plataforma", "nosotros") nos comprometemos a proteger la privacidad y los datos personales de quienes utilizan nuestros servicios de optimización y generación de currículums vitae. La presente Política de Privacidad describe qué datos recopilamos, para qué los usamos, cómo los protegemos y cuáles son tus derechos como titular.
          </p>
        </div>

        {/* Secciones */}
        <div className="space-y-4">
          {SECCIONES.map(({ num, titulo, contenido }) => (
            <div key={num} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold shrink-0">
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
          <p className="mt-1">Nota: Este documento es de carácter informativo. Se recomienda consultar con un abogado especializado en protección de datos para validación legal en cada jurisdicción.</p>
        </div>
      </div>
    </div>
  )
}
