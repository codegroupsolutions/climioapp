'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DemoModal from '@/components/DemoModal'
import ContactModal from '@/components/ContactModal'
import FeaturesGrid from '@/components/FeaturesGrid'
import { FaChartLine, FaDollarSign, FaStar, FaChartBar, FaUserPlus, FaUsers, FaClipboardCheck, FaRocket } from 'react-icons/fa'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-200' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Image
              src="/logo-black.png"
              alt="Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-6 py-2 text-gray-600 hover:text-black transition-colors font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-black text-white font-semibold hover:bg-gray-800 transition-all duration-300"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-7xl font-bold text-black mb-6 leading-tight tracking-tight">
            Gestiona tu negocio
            <br />
            <span className="text-gray-600">del futuro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Plataforma CRM inteligente diseñada para empresas de servicios de aire acondicionado y HVAC.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-black text-white text-lg font-bold hover:bg-gray-800 transition-all duration-300 transform hover:translate-y-[-2px]"
            >
              Iniciar Prueba Gratuita
            </Link>
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-8 py-4 border-2 border-black text-lg font-medium text-black hover:bg-black hover:text-white transition-all duration-300"
            >
              Solicitar Demostración
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid Component */}
      <FeaturesGrid />

      {/* Stats Section */}
      <section className="py-20 px-6 bg-white border-y-2 border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { Icon: FaDollarSign, label: 'Reduce Costos Operativos', desc: 'Automatiza procesos manuales y elimina el paperwork' },
              { Icon: FaChartLine, label: 'Mejora la Rentabilidad', desc: 'Optimiza rutas, inventario y tiempo de técnicos' },
              { Icon: FaStar, label: 'Aumenta la Satisfacción', desc: 'Respuesta rápida y seguimiento automatizado' },
              { Icon: FaChartBar, label: 'Toma Mejores Decisiones', desc: 'Dashboards y reportes en tiempo real' }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-black transition-colors">
                    <stat.Icon className="text-2xl text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="text-lg font-bold text-black mb-1">{stat.label}</div>
                <div className="text-gray-600 text-sm">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">¿Cómo Funciona?</h2>
            <p className="text-xl text-gray-600">Comienza a transformar tu negocio en 4 simples pasos</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                Icon: FaUserPlus,
                title: 'Regístrate y configura tu empresa',
                description: 'Crea tu cuenta gratis y personaliza tu perfil empresarial en minutos.'
              },
              {
                step: '2',
                Icon: FaUsers,
                title: 'Registra tus clientes',
                description: 'Añade tu base de clientes actual y organiza toda su información.'
              },
              {
                step: '3',
                Icon: FaClipboardCheck,
                title: 'Comienza a gestionar servicios',
                description: 'Crea cotizaciones, programa citas y gestiona tus servicios.'
              },
              {
                step: '4',
                Icon: FaRocket,
                title: 'Analiza y crece tu negocio',
                description: 'Obtén insights valiosos y toma decisiones basadas en datos reales.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                {/* Connector Line - hidden on mobile and for last item */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gray-300 z-0" style={{ width: 'calc(100% - 3rem)' }}></div>
                )}

                <div className="relative z-10 text-center">
                  {/* Step Number */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-24 h-24 bg-black text-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-xs uppercase tracking-wider mb-1">Paso</span>
                      <span className="text-2xl font-bold">{item.step}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <item.Icon className="text-3xl text-gray-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-black mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-block px-8 py-4 bg-black text-white text-lg font-bold hover:bg-gray-800 transition-all duration-300"
            >
              Comenzar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-2 border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              © 2025 CLIMIO. Todos los derechos reservados.{' '}
              <Link
                href="https://otizy.com"
                className="text-gray-600 hover:text-black transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                Powered by Otizy Technologies
              </Link>
              .
            </div>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-gray-600 hover:text-black transition-colors">Política de Privacidad</Link>
              <Link href="/terms" className="text-gray-600 hover:text-black transition-colors">Términos y Condiciones</Link>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-gray-600 hover:text-black transition-colors"
              >
                Contacto
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  )
}
