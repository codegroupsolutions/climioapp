'use client'

import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

export default function TermsPage() {
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

          <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
          <p className="text-gray-600 mt-2">Última actualización: 5 de octubre de 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 leading-relaxed">
              Al acceder y utilizar CLIMIO ("el Servicio"), usted acepta cumplir y estar sujeto a estos Términos y Condiciones.
              Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Descripción del Servicio</h2>
            <p className="text-gray-700 leading-relaxed">
              CLIMIO es una plataforma de gestión empresarial basada en la nube que proporciona herramientas para la
              administración de relaciones con clientes, operaciones comerciales, inventario, facturación y otras funcionalidades
              relacionadas con la gestión de negocios de servicios. El alcance específico de las funcionalidades puede variar
              según el plan de suscripción seleccionado y está sujeto a cambios mediante notificación previa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Registro de Cuenta</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Para utilizar el Servicio, debe:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Proporcionar información veraz, exacta y completa durante el registro</li>
              <li>Mantener la seguridad de su cuenta y contraseña</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Uso Aceptable y Prohibiciones</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              El uso del Servicio está sujeto al cumplimiento de todas las leyes, normas y reglamentos aplicables. Usted se
              compromete expresamente a no utilizar el Servicio para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Actividades que violen leyes federales, estatales o locales de Puerto Rico o Estados Unidos</li>
              <li>Transmitir, almacenar o distribuir contenido ilegal, difamatorio, obsceno o que infrinja derechos de propiedad intelectual de terceros</li>
              <li>Interferir con la seguridad, integridad o rendimiento del Servicio o de los sistemas de otros usuarios</li>
              <li>Intentar obtener acceso no autorizado a cuentas, sistemas informáticos o redes relacionadas con el Servicio</li>
              <li>Realizar ingeniería inversa, descompilar o desensamblar cualquier parte del Servicio</li>
              <li>Enviar comunicaciones comerciales no solicitadas o participar en prácticas de spam</li>
              <li>Suplantar la identidad de personas u organizaciones, o tergiversar su afiliación con ellas</li>
              <li>Recopilar o almacenar datos personales de otros usuarios sin su consentimiento expreso</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Nos reservamos el derecho de investigar y tomar acciones legales apropiadas contra cualquier persona que,
              a nuestra sola discreción, viole esta disposición.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Privacidad y Protección de Datos</h2>
            <p className="text-gray-700 leading-relaxed">
              La recopilación, uso, almacenamiento y protección de información personal está regida por nuestra Política de
              Privacidad, la cual forma parte integral de estos Términos. Al utilizar el Servicio, usted reconoce haber
              leído y aceptado dicha política. Implementamos medidas de seguridad razonables para proteger los datos, sin
              embargo, ningún sistema es completamente seguro. Usted reconoce y acepta los riesgos inherentes a la
              transmisión de información a través de Internet. En su carácter de controlador de datos de sus clientes, usted
              es responsable de cumplir con todas las leyes de protección de datos aplicables respecto a la información que
              almacena y procesa mediante el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Propiedad Intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              El Servicio y su contenido original, características y funcionalidad son propiedad de CLIMIO y están
              protegidos por derechos de autor, marcas registradas y otras leyes de propiedad intelectual. Usted retiene
              todos los derechos sobre los datos que ingresa en el sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Disponibilidad del Servicio y Garantías</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Aunque nos esforzamos por mantener el Servicio disponible de manera continua, no garantizamos que el mismo
              estará libre de interrupciones, errores o defectos. El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD",
              sin garantías de ningún tipo, ya sean expresas o implícitas. Específicamente:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>No garantizamos disponibilidad ininterrumpida, oportuna, segura o libre de errores del Servicio</li>
              <li>Podemos suspender, modificar o discontinuar cualquier aspecto del Servicio en cualquier momento</li>
              <li>Podemos realizar mantenimiento programado o de emergencia, lo cual puede resultar en interrupciones temporales</li>
              <li>No somos responsables por interrupciones causadas por fuerza mayor, fallas de terceros, o circunstancias fuera de nuestro control razonable</li>
              <li>Renunciamos expresamente a todas las garantías implícitas de comerciabilidad, idoneidad para un propósito particular y no infracción</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Usted asume toda la responsabilidad y riesgo por el uso del Servicio y los resultados obtenidos del mismo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitación de Responsabilidad</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY APLICABLE, EN NINGÚN CASO CLIMIO, SUS DIRECTORES, EMPLEADOS, SOCIOS,
              AGENTES, PROVEEDORES O AFILIADOS SERÁN RESPONSABLES POR:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Daños indirectos, incidentales, especiales, consecuentes, punitivos o ejemplares de cualquier tipo</li>
              <li>Pérdida de beneficios, ingresos, datos, uso, fondo de comercio u otras pérdidas intangibles</li>
              <li>Daños resultantes del uso, incapacidad de uso, o rendimiento del Servicio</li>
              <li>Acceso no autorizado, alteración o transmisión de sus datos o contenido</li>
              <li>Declaraciones o conducta de terceros en el Servicio</li>
              <li>Cualquier otro asunto relacionado con el Servicio</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Estas limitaciones aplican independientemente de la teoría legal sobre la cual se base el reclamo (contrato,
              agravio, negligencia, responsabilidad estricta u otra), aun cuando hayamos sido advertidos de la posibilidad
              de dichos daños. Algunas jurisdicciones no permiten la exclusión o limitación de daños incidentales o
              consecuentes, por lo que estas limitaciones pueden no aplicar en su caso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Indemnización</h2>
            <p className="text-gray-700 leading-relaxed">
              Usted acepta defender, indemnizar y mantener indemne a CLIMIO, sus afiliados, licenciantes y proveedores de
              servicios, y sus respectivos directores, empleados, contratistas, agentes, licenciantes, proveedores, sucesores
              y cesionarios, de y contra cualquier reclamo, responsabilidad, daño, sentencia, adjudicación, pérdida, costo,
              gasto o tarifa (incluyendo honorarios razonables de abogados y costos de litigio) que surjan de o estén
              relacionados con: (a) su violación de estos Términos; (b) su uso indebido del Servicio; (c) su violación de
              cualquier ley, norma o reglamento; (d) su violación de derechos de terceros, incluyendo derechos de propiedad
              intelectual, privacidad o publicidad; (e) cualquier contenido o dato que usted envíe, publique o transmita a
              través del Servicio; o (f) cualquier declaración falsa, inexacta o fraudulenta hecha por usted. Nos reservamos
              el derecho de asumir la defensa y control exclusivos de cualquier asunto sujeto a indemnización por su parte,
              en cuyo caso usted cooperará plenamente con nosotros en la defensa de dicho reclamo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Suspensión y Terminación</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Nos reservamos el derecho, a nuestra sola discreción, de suspender o terminar su acceso al Servicio,
              inmediatamente y sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo pero no limitándose a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violación de estos Términos y Condiciones o de cualquier política relacionada</li>
              <li>Conducta que consideremos, a nuestra sola discreción, inapropiada, fraudulenta o ilegal</li>
              <li>Uso del Servicio de manera que pueda causar daño a nosotros, otros usuarios o terceros</li>
              <li>Solicitud por su parte de cancelación o eliminación de cuenta</li>
              <li>Requerimientos de ley, orden judicial o gubernamental</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Usted puede cancelar su cuenta en cualquier momento a través de la configuración de su cuenta. Tras la
              terminación, su derecho de usar el Servicio cesará inmediatamente. Todas las disposiciones de estos Términos
              que por su naturaleza deban sobrevivir a la terminación, sobrevivirán, incluyendo sin limitación, disposiciones
              de propiedad, renuncias de garantía, indemnización y limitaciones de responsabilidad. La terminación de
              su acceso al Servicio no limitará ninguno de nuestros otros derechos o recursos legales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Propiedad de Datos y Exportación</h2>
            <p className="text-gray-700 leading-relaxed">
              Usted retiene todos los derechos de propiedad sobre los datos e información que ingresa al Servicio
              ("Contenido del Usuario"). Nos concede una licencia limitada, no exclusiva, libre de regalías, mundial y
              transferible para usar, almacenar, procesar y transmitir su Contenido del Usuario únicamente en la medida
              necesaria para proporcionar y mejorar el Servicio. Usted puede exportar su Contenido del Usuario en cualquier
              momento durante la vigencia de su suscripción utilizando las herramientas de exportación disponibles en el
              Servicio. Tras la cancelación o terminación de su cuenta, mantendremos su Contenido del Usuario por un
              período razonable para permitir su recuperación, después de lo cual será eliminado conforme a nuestra
              política de retención de datos. Usted es el único responsable de mantener copias de respaldo de su
              Contenido del Usuario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Modificaciones a los Términos</h2>
            <p className="text-gray-700 leading-relaxed">
              Nos reservamos el derecho de modificar, enmendar o actualizar estos Términos en cualquier momento a nuestra
              sola discreción. Si realizamos cambios materiales, haremos esfuerzos razonables para notificarle mediante
              correo electrónico a la dirección asociada con su cuenta o mediante un aviso destacado en el Servicio, con
              al menos treinta (30) días de anticipación a la fecha en que los cambios entren en vigor. Su uso continuado
              del Servicio después de la fecha de entrada en vigor de los Términos modificados constituirá su aceptación
              de dichos cambios. Si no está de acuerdo con los Términos modificados, debe cancelar su cuenta antes de la
              fecha de entrada en vigor. Es su responsabilidad revisar estos Términos periódicamente para estar informado
              de cualquier modificación. La versión más reciente de estos Términos estará siempre disponible en nuestro
              sitio web, con la fecha de "Última actualización" indicada en la parte superior del documento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Ley Aplicable y Jurisdicción</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Estos Términos y Condiciones, y cualquier disputa o reclamación que surja de o esté relacionada con ellos o
              su objeto o formación (incluyendo disputas o reclamaciones no contractuales), se regirán e interpretarán de
              acuerdo con las leyes del Estado Libre Asociado de Puerto Rico y, cuando sea aplicable, las leyes federales
              de los Estados Unidos de América, sin dar efecto a ningún principio de conflicto de leyes que requiera la
              aplicación de las leyes de otra jurisdicción.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Usted acepta irrevocablemente someterse a la jurisdicción exclusiva de los tribunales estatales y federales
              ubicados en Puerto Rico para la resolución de cualquier disputa, reclamación o controversia que surja de o
              esté relacionada con estos Términos o el Servicio. Usted renuncia expresamente a cualquier objeción a la
              jurisdicción de dichos tribunales y a cualquier reclamo de que dichos tribunales constituyen un foro
              inconveniente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">14. Resolución de Disputas y Arbitraje</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              En caso de cualquier controversia, reclamación o disputa que surja de o esté relacionada con estos Términos
              o el Servicio, las partes primero intentarán resolver la disputa mediante negociaciones de buena fe durante
              un período de treinta (30) días. Si la disputa no puede resolverse mediante negociación, cualquiera de las
              partes podrá proceder con acciones legales conforme a la Sección 13 anterior.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Usted acepta que cualquier reclamación que tenga contra nosotros debe presentarse dentro del plazo de un (1)
              año después de que surja dicha reclamación; de lo contrario, su reclamación quedará permanentemente excluida.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">15. Disposiciones Generales</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Acuerdo Completo:</strong> Estos Términos, junto con nuestra Política de Privacidad y cualquier otro
              aviso legal publicado en el Servicio, constituyen el acuerdo completo entre usted y nosotros con respecto al
              Servicio y reemplazan todos los acuerdos, representaciones y entendimientos previos o contemporáneos, ya sean
              escritos u orales.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Divisibilidad:</strong> Si cualquier disposición de estos Términos se considera inválida, ilegal o
              inaplicable por un tribunal de jurisdicción competente, dicha disposición será modificada e interpretada para
              lograr los objetivos de dicha disposición en la mayor medida posible bajo la ley aplicable, y las disposiciones
              restantes continuarán en pleno vigor y efecto.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Renuncia:</strong> Ninguna renuncia por nuestra parte a cualquier término o condición establecida en
              estos Términos se considerará como una renuncia adicional o continua de dicho término o condición o una renuncia
              a cualquier otro término o condición, y nuestro incumplimiento en hacer valer un derecho o disposición bajo
              estos Términos no constituirá una renuncia a dicho derecho o disposición.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Cesión:</strong> Usted no puede ceder ni transferir estos Términos, por ministerio de la ley o de otra
              manera, sin nuestro consentimiento previo por escrito. Cualquier intento de cesión en violación de esta
              disposición será nulo. Podemos ceder estos Términos libremente sin restricciones. Sujeto a lo anterior, estos
              Términos serán vinculantes y redundarán en beneficio de las partes, sus sucesores y cesionarios permitidos.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Relación de las Partes:</strong> Ninguna agencia, sociedad, empresa conjunta o relación de empleo se
              crea como resultado de estos Términos y usted no tiene autoridad de ningún tipo para obligar a CLIMIO en
              ningún aspecto.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Fuerza Mayor:</strong> No seremos responsables por ningún retraso o incumplimiento en el desempeño
              resultante de causas fuera de nuestro control razonable, incluyendo pero no limitándose a, actos naturales,
              guerra, terrorismo, disturbios, embargos, actos de autoridades civiles o militares, incendios, inundaciones,
              accidentes, huelgas o escasez de instalaciones de transporte, combustible, energía, mano de obra o materiales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">16. Información de Contacto</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Para cualquier pregunta, inquietud o notificación legal relacionada con estos Términos y Condiciones, puede
              contactarnos en: info@climio.app
            </p>
            <p className="text-gray-700 leading-relaxed">
              Responderemos a todas las consultas legítimas dentro de un plazo razonable.
            </p>
          </section>

          <section className="border-t pt-6">
            <p className="text-sm text-gray-600">
              Al hacer clic en "Crear Cuenta" o al usar nuestro Servicio, usted reconoce que ha leído, entendido y
              acepta estar sujeto a estos Términos y Condiciones.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}