"use client";

import { useState } from "react";

export default function AdminStep({ formData, updateFormData, onNext, onPrev }) {
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!formData.lastName) {
      newErrors.lastName = "El apellido es requerido";
    }

    if (!formData.email) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "La contraseña debe incluir mayúscula, minúscula, número y símbolo";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Por favor confirme la contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Número de teléfono inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Información del Administrador
        </h3>
        <p className="text-sm text-foreground-secondary">
          Este será el usuario administrador principal de la empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.firstName ? "border-error" : "border-border"}`}
            placeholder="Juan"
          />
          {errors.firstName && (
            <p className="text-error text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Apellido *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.lastName ? "border-error" : "border-border"}`}
            placeholder="Pérez"
          />
          {errors.lastName && (
            <p className="text-error text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.email ? "border-error" : "border-border"}`}
            placeholder="admin@ejemplo.com"
          />
          {errors.email && (
            <p className="text-error text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.phone ? "border-error" : "border-border"}`}
            placeholder="+52 123 456 7890"
          />
          {errors.phone && (
            <p className="text-error text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Contraseña *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10
                ${errors.password ? "border-error" : "border-border"}`}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-foreground-tertiary hover:text-foreground"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.password && (
            <p className="text-error text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Confirmar Contraseña *
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
              ${errors.confirmPassword ? "border-error" : "border-border"}`}
            placeholder="Repita la contraseña"
          />
          {errors.confirmPassword && (
            <p className="text-error text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onPrev}
          className="btn bg-background-tertiary text-foreground hover:bg-border"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn btn-primary"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
