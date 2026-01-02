'use client'

import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="text-sm" />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
          <p className="text-gray-600 mt-2">Última actualización: 5 de octubre de 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introducción</h2>
            <p className="text-gray-700 leading-relaxed">
              En CLIMIO ("nosotros", "nuestro" o "la Empresa"), valoramos y respetamos su privacidad. Esta Política de
              Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza
              nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Información que Recopilamos</h2>
            <p className="text-gray-700 leading-relaxed">
              Recopilamos la información necesaria para proporcionar y mejorar nuestro Servicio, incluyendo datos de
              registro, información comercial y operativa, así como datos técnicos relacionados con el uso de la plataforma.
              Esta información se recopila con el fin de cumplir con nuestras obligaciones contractuales y proporcionar
              las funcionalidades del Servicio de manera efectiva.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cómo Usamos su Información</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Utilizamos la información recopilada para los siguientes propósitos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Proporcionar y mantener nuestro Servicio</li>
              <li>Procesar transacciones y gestionar su cuenta</li>
              <li>Enviar notificaciones importantes sobre el Servicio</li>
              <li>Proporcionar soporte técnico y atención al cliente</li>
              <li>Mejorar y personalizar la experiencia del usuario</li>
              <li>Desarrollar nuevas funcionalidades y servicios</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
              <li>Prevenir fraudes y actividades no autorizadas</li>
              <li>Generar análisis y reportes agregados (sin información personal identificable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base Legal para el Procesamiento</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Procesamos su información personal bajo las siguientes bases legales:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Consentimiento:</strong> Cuando ha dado su consentimiento para el procesamiento</li>
              <li><strong>Contrato:</strong> Para cumplir con nuestras obligaciones contractuales</li>
              <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios y operaciones comerciales</li>
              <li><strong>Cumplimiento legal:</strong> Para cumplir con las leyes aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Compartir Información</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las siguientes circunstancias:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Proveedores de servicios:</strong> Compartimos información con proveedores que nos ayudan a operar
                  nuestro negocio (hosting, procesamiento de pagos, análisis)</li>
              <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o proceso legal válido</li>
              <li><strong>Protección de derechos:</strong> Para proteger los derechos, propiedad o seguridad de la Empresa,
                  nuestros usuarios u otros</li>
              <li><strong>Transacciones comerciales:</strong> En caso de fusión, adquisición o venta de activos</li>
              <li><strong>Con su consentimiento:</strong> Cuando usted nos autorice expresamente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Seguridad de los Datos</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cifrado de datos en tránsito y en reposo</li>
              <li>Acceso restringido basado en roles y permisos</li>
              <li>Autenticación de múltiples factores disponible</li>
              <li>Monitoreo continuo de seguridad y detección de amenazas</li>
              <li>Copias de seguridad regulares y planes de recuperación</li>
              <li>Auditorías de seguridad periódicas</li>
              <li>Capacitación del personal en mejores prácticas de seguridad</li>
              <li>Contratos de confidencialidad con empleados y contratistas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Retención de Datos</h2>
            <p className="text-gray-700 leading-relaxed">
              Conservamos su información personal solo durante el tiempo necesario para cumplir con los propósitos
              descritos en esta política, típicamente mientras mantenga una cuenta activa con nosotros. Los períodos
              de retención específicos pueden variar según el tipo de información y las obligaciones legales aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Sus Derechos de Privacidad</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Usted tiene los siguientes derechos con respecto a su información personal:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Acceso:</strong> Solicitar una copia de la información personal que tenemos sobre usted</li>
              <li><strong>Rectificación:</strong> Corregir cualquier información inexacta o incompleta</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de su información personal</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado y legible por máquina</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos en ciertas circunstancias</li>
              <li><strong>Restricción:</strong> Solicitar la restricción del procesamiento de sus datos</li>
              <li><strong>Retirar consentimiento:</strong> Cuando el procesamiento se base en consentimiento</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Para ejercer estos derechos, contáctenos a través de los medios proporcionados al final de esta política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Cookies y Tecnologías de Seguimiento</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Utilizamos cookies y tecnologías similares para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Mantener su sesión activa</li>
              <li>Recordar sus preferencias y configuraciones</li>
              <li>Analizar el uso de la plataforma</li>
              <li>Mejorar el rendimiento y la funcionalidad</li>
              <li>Proporcionar seguridad adicional</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Privacidad de Menores</h2>
            <p className="text-gray-700 leading-relaxed">
              Nuestro Servicio no está dirigido a personas menores de 18 años. No recopilamos conscientemente información
              personal de menores. Si descubrimos que hemos recopilado información de un menor sin el consentimiento
              parental verificable, eliminaremos esa información de inmediato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Transferencias Internacionales</h2>
            <p className="text-gray-700 leading-relaxed">
              Su información puede ser transferida y mantenida en servidores ubicados fuera de Puerto Rico. Al utilizar
              nuestro Servicio, usted consiente estas transferencias. Nos aseguramos de que dichas transferencias cumplan
              con las leyes de protección de datos aplicables mediante el uso de salvaguardias apropiadas como cláusulas
              contractuales estándar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Notificación de Brechas</h2>
            <p className="text-gray-700 leading-relaxed">
              En caso de una brecha de seguridad que afecte su información personal, le notificaremos de acuerdo con
              las leyes aplicables. La notificación incluirá información sobre la naturaleza de la brecha, las medidas
              tomadas y las recomendaciones para proteger su información.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Cambios a esta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios significativos
              mediante un aviso en nuestro Servicio o por correo electrónico. Le recomendamos revisar esta política
              regularmente. Su uso continuado del Servicio después de los cambios constituye su aceptación de la política
              actualizada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">14. Cumplimiento Regulatorio</h2>
            <p className="text-gray-700 leading-relaxed">
              Cumplimos con las leyes y regulaciones de protección de datos aplicables, incluyendo pero no limitándose a
              las leyes de privacidad de Puerto Rico y Estados Unidos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contacto</h2>
            <p className="text-gray-700 leading-relaxed">
              Si tiene preguntas, inquietudes o desea ejercer sus derechos de privacidad, contáctenos: info@climio.app
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Responderemos a su solicitud dentro de 30 días hábiles.
            </p>
          </section>

          <section className="border-t pt-6">
            <p className="text-sm text-gray-600">
              Esta Política de Privacidad forma parte de nuestros Términos y Condiciones. Al utilizar nuestro Servicio,
              usted acepta la recopilación y uso de información de acuerdo con esta política.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}