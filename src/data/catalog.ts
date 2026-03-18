export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  basePrice: number; // Placeholder for logic
  unit: string;
  recurring: boolean;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  items: ServiceItem[];
};

export const catalog: Category[] = [
  {
    id: "620200",
    name: "Consultoría, Estrategia y Diagnóstico",
    description: "Costo de pensar, analizar y planificar.",
    items: [
      { id: "C-01", name: "Sesión de diagnóstico comercial inicial", description: "", basePrice: 50000, unit: "hora", recurring: false },
      { id: "C-02", name: "Auditoría de madurez digital actual del cliente", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "C-03", name: "Levantamiento de requerimientos técnicos (ERS)", description: "", basePrice: 200000, unit: "global", recurring: false },
      { id: "C-04", name: "Mapeo de arquitectura de datos y procesos actuales (Especial Pymes)", description: "", basePrice: 250000, unit: "global", recurring: false },
      { id: "C-05", name: "Diseño del nuevo flujo de procesos optimizado", description: "", basePrice: 200000, unit: "global", recurring: false },
      { id: "C-06", name: "Redacción de Documento de Alcance del Proyecto (EDT)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "C-07", name: "Definición de roadmap y cronograma de hitos", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "C-08", name: "Sesión de consultoría estratégica/negocios mensual", description: "Retainer", basePrice: 300000, unit: "mensual", recurring: true },
      { id: "C-09", name: "Evaluación de viabilidad, riesgo y Equity (Modelo Startups)", description: "", basePrice: 250000, unit: "global", recurring: false },
    ]
  },
  {
    id: "741000",
    name: "Diseño de Identidad y UX/UI",
    description: "Costo de crear la marca y la experiencia visual.",
    items: [
      { id: "D-01", name: "Conceptualización y Moodboard (Investigación visual)", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "D-02", name: "Diseño de Isotipo (Símbolo)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "D-03", name: "Diseño de Logotipo (Tipografía/Nombre)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "D-04", name: "Definición de Paleta Cromática y Sistema Tipográfico", description: "", basePrice: 80000, unit: "global", recurring: false },
      { id: "D-05", name: "Manual de Marca Básico (Reglas de uso esenciales)", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "D-06", name: "Manual de Marca Corporativo (Aplicaciones avanzadas)", description: "", basePrice: 200000, unit: "global", recurring: false },
      { id: "D-07", name: "Arquitectura de Información (Sitemap de web/app)", description: "", basePrice: 120000, unit: "global", recurring: false },
      { id: "D-08", name: "Diseño UX / Wireframes (Estructura sin color)", description: "", basePrice: 40000, unit: "pantalla", recurring: false },
      { id: "D-09", name: "Diseño UI / Mockups (Diseño final alta fidelidad)", description: "", basePrice: 60000, unit: "pantalla", recurring: false },
      { id: "D-10", name: "Prototipado interactivo navegable (Figma)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "D-11", name: "Diseño de iconografía personalizada y assets visuales", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "D-12", name: "Diseño de papelería corporativa / firmas de email", description: "", basePrice: 80000, unit: "global", recurring: false },
    ]
  },
  {
    id: "620100-dev",
    name: "Desarrollo y Programación",
    description: "Costo de ejecución técnica (Gabriel Quezada).",
    items: [
      { id: "P-01", name: "Setup de entorno de desarrollo y repositorios (Git)", description: "", basePrice: 50000, unit: "global", recurring: false },
      { id: "P-02", name: "Modelado y estructuración de Base de Datos", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "P-03", name: "Maquetación Frontend estática (HTML/CSS/JS)", description: "", basePrice: 40000, unit: "pantalla", recurring: false },
      { id: "P-04", name: "Desarrollo de lógica Frontend (React, Angular, etc.)", description: "", basePrice: 200000, unit: "global", recurring: false },
      { id: "P-05", name: "Desarrollo Backend/API (Lógica de servidor)", description: "", basePrice: 80000, unit: "módulo/CRUD", recurring: false },
      { id: "P-06", name: "Desarrollo de Módulo de Autenticación (Login/Registro/Roles)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "P-07", name: "Desarrollo de Panel de Administración (Backoffice para el cliente)", description: "", basePrice: 250000, unit: "global", recurring: false },
      { id: "P-08", name: "Integración de Pasarela de Pagos (Webpay, MercadoPago, etc.)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "P-09", name: "Integración de APIs de terceros (CRM, ERP, Facturación electrónica, Maps)", description: "", basePrice: 120000, unit: "integración", recurring: false },
      { id: "P-10", name: "Acondicionamiento Marca Blanca", description: "Eliminar rastros de Impulsa Studio para agencias B2B", basePrice: 100000, unit: "global", recurring: false },
      { id: "P-11", name: "Migración de datos históricos del cliente al nuevo sistema", description: "", basePrice: 200000, unit: "global", recurring: false },
    ]
  },
  {
    id: "620100-infra",
    name: "Despliegue, Pruebas e Infraestructura",
    description: "Costo de hacer que el software viva en internet y sea seguro (Equipo de Despliegue).",
    items: [
      { id: "I-01", name: "Testing QA funcional en entorno de pruebas", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "I-02", name: "Pruebas de validación de sistemas y estrés", description: "Equipo de Despliegue", basePrice: 150000, unit: "global", recurring: false },
      { id: "I-03", name: "Optimización de velocidad y rendimiento (WPO / Core Web Vitals)", description: "", basePrice: 120000, unit: "global", recurring: false },
      { id: "I-04", name: "Compilación y despliegue a producción (Puesta en marcha)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "I-05", name: "Contratación/Setup de Hosting (VPS, Cloud o Dedicado)", description: "", basePrice: 80000, unit: "global", recurring: false },
      { id: "I-06", name: "Registro y configuración de Dominio DNS (.cl, .com)", description: "", basePrice: 30000, unit: "global", recurring: false },
      { id: "I-07", name: "Instalación y configuración de Certificado de Seguridad (SSL)", description: "", basePrice: 40000, unit: "global", recurring: false },
      { id: "I-08", name: "Configuración de correos corporativos (Workspace, Zoho, etc.)", description: "", basePrice: 60000, unit: "global", recurring: false },
      { id: "I-09", name: "Configuración de CDN y Firewall de seguridad (ej. Cloudflare)", description: "", basePrice: 80000, unit: "global", recurring: false },
      { id: "I-10", name: "Setup de almacenamiento en la nube para assets pesados (AWS S3, Google Cloud)", description: "", basePrice: 100000, unit: "global", recurring: false },
    ]
  },
  {
    id: "mkt",
    name: "Marketing 360 y Crecimiento",
    description: "Costo de atracción y medición.",
    items: [
      { id: "M-01", name: "Setup de cuentas publicitarias (Business Manager, Google Ads)", description: "", basePrice: 80000, unit: "global", recurring: false },
      { id: "M-02", name: "Instalación de Píxeles de seguimiento y Google Analytics", description: "", basePrice: 60000, unit: "global", recurring: false },
      { id: "M-03", name: "Configuración de eventos de conversión (Google Tag Manager)", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "M-04", name: "Diseño y desarrollo de Landing Page orientada a conversión", description: "", basePrice: 250000, unit: "global", recurring: false },
      { id: "M-05", name: "Redacción de Copywriting persuasivo para anuncios", description: "", basePrice: 60000, unit: "global", recurring: false },
      { id: "M-06", name: "Diseño de piezas gráficas o edición de video para pauta publicitaria", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "M-07", name: "Gestión y optimización de campañas de pago", description: "Fee mensual", basePrice: 250000, unit: "mensual", recurring: true },
      { id: "M-08", name: "Creación de contenido orgánico para redes sociales", description: "Packs mensuales", basePrice: 300000, unit: "mensual", recurring: true },
      { id: "M-09", name: "Auditoría y optimización SEO On-Page (Posicionamiento en Google)", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "M-10", name: "Creación de Dashboard de Métricas en tiempo real (ej. Looker Studio)", description: "", basePrice: 120000, unit: "global", recurring: false },
      { id: "M-11", name: "Generación de Reporte de Rendimiento mensual", description: "", basePrice: 50000, unit: "mensual", recurring: true },
    ]
  },
  {
    id: "support",
    name: "Soporte, Capacitación y Retainer Mensual",
    description: "Costo de mantener al cliente feliz y facturando a largo plazo.",
    items: [
      { id: "S-01", name: "Capacitación de uso de herramientas para el cliente o su personal", description: "", basePrice: 40000, unit: "hora", recurring: false },
      { id: "S-02", name: "Elaboración de Manual de Usuario o Video Tutoriales", description: "", basePrice: 150000, unit: "global", recurring: false },
      { id: "S-03", name: "Soporte técnico correctivo mensual", description: "Bolsa de horas para arreglar fallos", basePrice: 150000, unit: "mensual", recurring: true },
      { id: "S-04", name: "Mantenimiento preventivo mensual", description: "Actualización de versión, plugins, librerías", basePrice: 120000, unit: "mensual", recurring: true },
      { id: "S-05", name: "Gestión y monitoreo de Backups (Copias de seguridad recurrentes)", description: "", basePrice: 50000, unit: "mensual", recurring: true },
    ]
  },
  {
    id: "admin",
    name: "Administración, Legal y Modificadores Comerciales",
    description: "Costo de la gestión interna y protección de la empresa.",
    items: [
      { id: "A-01", name: "Fee de Project Management", description: "Horas de coordinación entre socios, Gabriel y cliente", basePrice: 50000, unit: "hora", recurring: false },
      { id: "A-02", name: "Redacción de Términos y Condiciones / Políticas de Privacidad web", description: "", basePrice: 100000, unit: "global", recurring: false },
      { id: "A-03", name: "Redacción de Acta de Entrega y Aceptación de Hitos (Para liberar pagos)", description: "", basePrice: 50000, unit: "global", recurring: false },
      { id: "A-04", name: "Recargo por Urgencia", description: "Multiplicador de precio por proyectos 'para ayer'", basePrice: 1.5, unit: "multiplicador", recurring: false },
      { id: "A-05", name: "Tasa de riesgo/éxito (Success Fee para modelo Startups)", description: "", basePrice: 0.1, unit: "porcentaje", recurring: false },
      { id: "A-06", name: "Recargo financiero por fraccionamiento de pagos (Modelo Híbrido)", description: "", basePrice: 0.05, unit: "porcentaje", recurring: false },
      { id: "A-07", name: "Comisión/Markup por gestión de compras de terceros (Licencias, plantillas)", description: "", basePrice: 0.15, unit: "porcentaje", recurring: false },
    ]
  }
];