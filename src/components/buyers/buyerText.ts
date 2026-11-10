// Every word on the buyer pages a new yard walks through right after signing up
// (sign-up, login, password recovery, the menu, documents, dashboard, checklist,
// card settings, bid-rules list), plus ledger, disputes and marketplace, in
// English and Spanish (George, 2026-11-10). Won cars is still English.
// Same pattern as ruleText.ts: one typed table per language, no i18n library.
// Spanish: plain Mexican/Texas Spanish, "usted", the outreach words
// (carros de chatarra, registrarse, recoger, tarjeta, identificación, yarda, comisión).
import type { Lang } from "@/lib/buyer-lang";

export type SignupField =
  | "business_name" | "login_email" | "password"
  | "contact_name" | "address" | "phone"
  | "website" | "license_number" | "notification_email";

const en = {
  loading: "Loading…",
  serverOther: (code: string) => `Something went wrong (${code}). Please try again.`,

  nav: {
    dashboard: "Dashboard",
    bidRules: "Bid Rules",
    wonCars: "Won Cars",
    ledger: "Ledger",
    disputes: "Disputes",
    settings: "Settings",
    signOut: "Sign Out",
  },

  signup: {
    title: "Create Junkerz Buyer Account",
    intro:
      "Takes about 2 minutes. You can set your prices right away. Before you can win cars you'll add a photo ID and a card (not charged until a pickup) — you can skip those for now and come back.",
    needBefore: "What you'll need before you can win cars",
    loginSection: "Login credentials",
    businessSection: "Business profile",
    fields: {
      business_name: "Business name",
      login_email: "Login email",
      password: "Password",
      contact_name: "Your name",
      address: "Yard address",
      phone: "Phone",
      website: "Website",
      license_number: "License number",
      notification_email: "Notification email",
    } as Record<SignupField, string>,
    placeholders: {
      contact_name: "Jane Doe",
      address: "Street, City, State, ZIP",
      phone: "(555) 555-0100",
      website: "https://example.com",
      license_number: "State dealer / dismantler #",
      notification_email: "Defaults to your login email if blank",
    },
    moreDetails: "More details (optional): text alerts, website, license number, notification email",
    smsBox:
      "Yes, text me when I win a car, when a pickup is scheduled or rescheduled, and pickup reminders (optional).",
    // Carrier-reviewed SMS disclosure. Do not shorten or reword.
    smsConsent:
      "By checking this box and providing your phone number, you agree to receive SMS car-assignment, pickup and reminder messages from Junkerz. Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. We will not share mobile information with third parties for promotional or marketing purposes. Leave the box unchecked and we contact you by email only. See our",
    termsLink: "Terms",
    and: "and",
    privacyLink: "Privacy Policy",
    notificationHelp:
      "Where we send won-match notifications + reschedule alerts. Can differ from your login email.",
    submit: "Create account + continue",
    creating: "Creating…",
    footer:
      "Fields marked * are required. Set your prices as soon as you sign up. You can win cars once you add a photo ID and a card and we approve your account.",
    configFailed: "Unable to load onboarding requirements. Please reload before signing up.",
    // problems the server sends back (error codes)
    server: {
      form_expired: "This form expired. Please check your details and press Create again in a few seconds.",
      check_form:
        "We couldn't save your application. Please reload the page and try again. If it keeps happening, turn off autofill for this form.",
      too_fast: "That was quick! Please check your details and press Create again.",
      email_exists: "An account with this email already exists. Sign in instead, or use Forgot password.",
      missing: "Please fill in business name, login email and password.",
      missing_fields: "Please fill in business name, login email and password.",
      missing_required: "Please fill in every field marked *.",
      signup_failed: "We couldn't create your account. Please try again in a minute.",
    } as Record<string, string>,
  },

  login: {
    title: "Junkerz Buyer Login",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    forgot: "Forgot password?",
    newBuyer: "New buyer?",
    create: "Create an account",
    failed: "Login failed",
    server: {
      bad_credentials: "Wrong email or password.",
    } as Record<string, string>,
  },

  recover: {
    title: "Recover your buyer account",
    intro: "Use your commercial buyer login email. Recovery links expire after 15 minutes and work once.",
    newPassword: "New password",
    loginEmail: "Login email",
    wait: "Please wait…",
    reset: "Reset password",
    send: "Send recovery email",
    sent: "If an account exists, a recovery email will arrive shortly.",
    updated: "Password updated. Sign in with your new password.",
    requestNew: "Request a new link",
    back: "Back to buyer login",
    // shown as "<problem>. Request a new link", so no closing period here
    unavailable: "Recovery is unavailable. Try again",
    server: {
      recovery_link_invalid_expired_or_limited: "This link is not valid, has expired, or was already used",
      password_must_be_8_to_128_characters: "Password must be 8 to 128 characters",
      recovery_unavailable: "Recovery is unavailable. Try again",
    } as Record<string, string>,
  },

  checklist: {
    aria: "Buyer onboarding checklist",
    title: "Buyer onboarding",
    policy: (v: number) =>
      `Requirements version ${v}. Requested optional documents do not hold up approval.`,
    // English shows the server's own label; these are the same words.
    itemLabels: {
      w9: "W-9",
      license: "Business license",
      insurance: "Insurance certificate",
      id: "Photo ID",
      terms: "Sign Terms of Service",
      card: "Card on file",
    } as Record<string, string>,
    required: "Required",
    optional: "Requested · optional",
    uploadedReview: "Uploaded · awaiting review",
    signed: "Signed",
    saved: "Saved",
    reviewed: "Reviewed",
    rejected: "Rejected · upload a replacement",
    uploaded: "Uploaded",
    incomplete: "Incomplete",
    complete: (label: string) => `Complete ${label}`,
    approved: "Business approved",
    ready: "Ready for staff approval",
    pending: "Business approval pending",
    paymentReady: "Payment method ready",
    addPayment: "Add a payment method",
    inactive: (reason?: string) =>
      `Account inactive${reason ? `: ${reason}` : ""}. Contact Junkerz for assistance.`,
    footer: "You can set your prices now. You can win cars once the required items are done and we approve your account.",
  },

  documents: {
    title: "Upload your documents",
    intro: "Complete required items for staff approval. PDF, PNG or JPG files up to 10 MB.",
    upload: (label: string) => `Upload ${label}`,
    replace: (label: string) => `Replace ${label}`,
    uploading: "Uploading…",
    termsBefore: "Read the",
    termsLink: "Terms of Service",
    termsAfter: "before accepting.",
    accept: "I accept the Terms of Service",
    loadingChecklist: "Loading saved checklist…",
    continue: "Continue to dashboard",
    skip: "Skip for now",
    footer: "Your saved progress stays on your dashboard. Return to any incomplete item there.",
    uploadFailed: "Upload failed",
    termsFailed: "Could not save acceptance",
    server: {
      file_too_large: "That file is over 10 MB. Pick a smaller file.",
      unsupported_extension: "Use a PDF, PNG or JPG file.",
      no_file: "Pick a file first.",
      bad_document_type: "That document type is not accepted.",
      upload_failed: "Upload failed",
    } as Record<string, string>,
  },

  dashboard: {
    marketplace: "Marketplace",
    wonCars: "Won cars",
    bidRules: "Bid rules",
    paymentBefore: "Set up your",
    paymentLink: "payment method",
    paymentAfter: "for pickup finder fees.",
    pendingTitle: "Account pending approval",
    pendingDefault: "Complete the required checklist items so staff can review your account.",
    balance: "Available Balance",
    reliability: "Reliability Score",
    tier: "Tier",
    tiers: { standard: "standard" } as Record<string, string>,
  },

  settings: {
    title: "Settings",
    returnLink: "Return to pickup to retry payment",
    returnNote:
      "Return to your completed pickup and select Retry payment to settle its outstanding finder fee.",
    paymentTitle: "Payment method",
    paymentIntro:
      "Save a card for pickup finder fees. Saving a card does not charge it. Card details are entered securely through Stripe.",
    cardLine: (brand: string, last4: string, month: number, year: number) =>
      `${brand} ending in ${last4} · Expires ${month}/${year}`,
    onFile: "A payment method is on file.",
    noCard: "No card on file.",
    saved: "Card saved.",
    refreshFailed: "Your card was saved, but its details could not refresh. Reload this page.",
    testMode: "Stripe test mode — use test card details only.",
    replaceCard: "Replace card",
    addCard: "Add card",
    unavailable: "Card setup is unavailable. Please contact Junkerz support.",
    unavailableShort: "Card setup is unavailable.",
    loadFailed: "Could not load payment settings.",
    // Card-on-file authorization. Translate faithfully; do not shorten.
    consent:
      "I authorize Junkerz to save this card and charge the applicable finder fee when I complete a pickup, under my buyer agreement.",
    authFailed: "Card authentication failed. Please try again.",
    notComplete: "Card setup is not complete. Please try again.",
    saveFailed: "Could not save card.",
    secureLoadFailed: "Secure card entry could not load. Refresh this page to try again.",
    saving: "Saving…",
    saveCard: "Save card",
  },

  rules: {
    title: "Bid Rules",
    newRule: "+ New rule",
    empty: "No bid rules yet. Create one to start receiving matched cars.",
    colName: "Name",
    colBid: "Bid",
    colActive: "Active",
    colPriority: "Priority",
    colNotify: "Notify",
    colWeek: "This week",
    colFilters: "Filters",
    ruleN: (id: number) => `Rule ${id}`,
    on: "ON",
    off: "OFF",
    pauseTitle: "Click to pause this rule",
    activateTitle: "Click to activate this rule",
    edit: "Edit",
    clone: "Clone",
    cloneTitle: "Make a copy of this rule (starts inactive)",
    delete: "Delete",
    confirmDelete: "Delete this rule?",
  },

  ledger: {
    title: "Ledger",
    empty: "No ledger entries yet.",
    colDate: "Date",
    colType: "Type",
    colAmount: "Amount",
    colBalance: "Balance",
    colNotes: "Notes",
    // entry types the server writes; anything else shows as the server wrote it
    types: {} as Record<string, string>,
  },

  disputes: {
    title: "Disputes",
    cancel: "Cancel",
    open: "+ Open dispute",
    matchId: "Match ID",
    matchHelp: "Find the match ID on the Won Cars page.",
    reason: "Reason",
    reasons: {
      not_as_described: "not as described",
      title_problem: "title problem",
      not_delivered: "not delivered",
      damaged_in_transport: "damaged in transport",
      wrong_vehicle: "wrong vehicle",
    } as Record<string, string>,
    description: "Description (optional)",
    submitting: "Submitting…",
    submit: "Submit dispute",
    empty: "No disputes yet.",
    colMatch: "Match",
    colReason: "Reason",
    colStatus: "Status",
    colResolved: "Resolved",
    colWhen: "When",
    statuses: {
      open: "open",
      investigating: "investigating",
      resolved_buyer: "resolved buyer",
      resolved_seller: "resolved seller",
      closed: "closed",
    } as Record<string, string>,
    server: {
      invalid_match: "Invalid match ID",
      missing: "Fill in the match ID and the reason.",
      invalid_reason: "Pick a reason from the list.",
      bad_evidence_urls: "One of the photo links could not be read.",
      not_yours: "That match ID is not one of your cars.",
    } as Record<string, string>,
  },

  market: {
    title: "Marketplace",
    dashboard: "Dashboard",
    intro:
      "Browse active offers. Your queue rank shows where you stand on each — bid rules decide which buyers get matched, and rank 1 is currently selected.",
    yearMin: "Year ≥",
    yearMax: "Year ≤",
    make: "Make",
    condition: "Condition",
    any: "Any",
    conditions: {
      running: "Running",
      non_running: "Non-running",
      wrecked: "Wrecked",
      parts: "Parts only",
    } as Record<string, string>,
    zip: "ZIP starts with",
    searching: "Searching…",
    search: "Search",
    clear: "Clear",
    empty: "No active offers match your filters right now. Try widening the year range or clearing filters.",
    vin: "VIN",
    offerPrice: "Offer price",
    titleChip: (s: string) => `Title: ${s}`,
    unknown: "unknown",
    today: "today",
    yesterday: "yesterday",
    daysAgo: (d: number) => `${d} days ago`,
    queue: (n: number) => `${n} buyer${n === 1 ? "" : "s"} in queue`,
    notInQueue: "Not in queue",
    youWon: "You won",
    myStatuses: { declined: "declined", expired: "expired" } as Record<string, string>,
    rank: (n: number) => `Rank #${n}`,
    showing: (n: number) =>
      `Showing ${n} of latest 60 days of active offers. Refine filters or check back — new offers post as sellers accept quotes.`,
  },
};

export type BuyerText = typeof en;

const es: BuyerText = {
  loading: "Cargando…",
  serverOther: (code: string) => `Algo salió mal (${code}). Intente de nuevo.`,

  nav: {
    dashboard: "Inicio",
    bidRules: "Reglas de oferta",
    wonCars: "Carros ganados",
    ledger: "Estado de cuenta",
    disputes: "Reclamos",
    settings: "Ajustes",
    signOut: "Cerrar sesión",
  },

  signup: {
    title: "Crear su cuenta de comprador en Junkerz",
    intro:
      "Toma unos 2 minutos. Puede poner sus precios de inmediato. Antes de poder ganar carros, tendrá que agregar una identificación con foto y una tarjeta (no se le cobra hasta que recoja un carro) — puede saltar eso por ahora y regresar después.",
    needBefore: "Lo que necesita antes de poder ganar carros",
    loginSection: "Datos para entrar",
    businessSection: "Datos del negocio",
    fields: {
      business_name: "Nombre del negocio",
      login_email: "Correo para entrar",
      password: "Contraseña",
      contact_name: "Su nombre",
      address: "Dirección de la yarda",
      phone: "Teléfono",
      website: "Sitio web",
      license_number: "Número de licencia",
      notification_email: "Correo para avisos",
    },
    placeholders: {
      contact_name: "Juan Pérez",
      address: "Calle, ciudad, estado, código postal",
      phone: "(555) 555-0100",
      website: "https://ejemplo.com",
      license_number: "Núm. de licencia estatal de dealer o desarmadero",
      notification_email: "Si lo deja en blanco, usamos su correo para entrar",
    },
    moreDetails: "Más datos (opcional): avisos por texto, sitio web, número de licencia, correo para avisos",
    smsBox:
      "Sí, mándenme mensajes de texto cuando gane un carro, cuando se programe o se cambie una recogida, y recordatorios de recogida (opcional).",
    // Same approved Spanish wording as the seller quote form (src/app/quote/page.tsx),
    // with the buyer's message types and the buyer form's email-only sentence.
    smsConsent:
      "Al marcar esta casilla y darnos su teléfono, acepta recibir mensajes SMS de Junkerz sobre carros asignados, recogidas y recordatorios. La frecuencia de los mensajes puede variar. Pueden aplicar tarifas estándar de mensajes y datos. Responda STOP para cancelar. Responda HELP para recibir ayuda. No compartiremos su información móvil con terceros para fines promocionales o de marketing. Si deja la casilla sin marcar, solo le contactamos por correo electrónico. Vea nuestros",
    termsLink: "Términos",
    and: "y nuestra",
    privacyLink: "Política de privacidad",
    notificationHelp:
      "Adonde mandamos los avisos de carros ganados y de cambios de recogida. Puede ser distinto a su correo para entrar.",
    submit: "Crear cuenta y continuar",
    creating: "Creando…",
    footer:
      "Los campos con * son obligatorios. Puede poner sus precios en cuanto se registre. Puede ganar carros cuando agregue una identificación con foto y una tarjeta y aprobemos su cuenta.",
    configFailed: "No pudimos cargar los requisitos de registro. Recargue la página antes de registrarse.",
    server: {
      form_expired: "Este formulario se venció. Revise sus datos y vuelva a presionar Crear en unos segundos.",
      check_form:
        "No pudimos guardar su solicitud. Recargue la página e intente de nuevo. Si sigue pasando, apague el autocompletado para este formulario.",
      too_fast: "¡Qué rápido! Revise sus datos y vuelva a presionar Crear.",
      email_exists: "Ya hay una cuenta con este correo. Mejor entre a su cuenta, o use ¿Olvidó su contraseña?",
      missing: "Llene el nombre del negocio, el correo para entrar y la contraseña.",
      missing_fields: "Llene el nombre del negocio, el correo para entrar y la contraseña.",
      missing_required: "Llene todos los campos marcados con *.",
      signup_failed: "No pudimos crear su cuenta. Intente de nuevo en un minuto.",
    },
  },

  login: {
    title: "Entrar como comprador de Junkerz",
    email: "Correo electrónico",
    password: "Contraseña",
    signIn: "Entrar",
    signingIn: "Entrando…",
    forgot: "¿Olvidó su contraseña?",
    newBuyer: "¿Comprador nuevo?",
    create: "Registrarse",
    failed: "No se pudo entrar",
    server: {
      bad_credentials: "El correo o la contraseña no son correctos.",
    },
  },

  recover: {
    title: "Recuperar su cuenta de comprador",
    intro:
      "Use el correo con el que entra a su cuenta de comprador. Los enlaces para recuperar la cuenta vencen a los 15 minutos y sirven una sola vez.",
    newPassword: "Contraseña nueva",
    loginEmail: "Correo para entrar",
    wait: "Espere…",
    reset: "Cambiar contraseña",
    send: "Mandar correo para recuperar",
    sent: "Si la cuenta existe, pronto le llegará un correo para recuperarla.",
    updated: "Contraseña cambiada. Entre con su contraseña nueva.",
    requestNew: "Pida un enlace nuevo",
    back: "Volver a entrar como comprador",
    unavailable: "No se puede recuperar la cuenta ahora. Intente de nuevo",
    server: {
      recovery_link_invalid_expired_or_limited: "Este enlace no sirve, ya venció o ya se usó",
      password_must_be_8_to_128_characters: "La contraseña debe tener de 8 a 128 caracteres",
      recovery_unavailable: "No se puede recuperar la cuenta ahora. Intente de nuevo",
    },
  },

  checklist: {
    aria: "Lista de pasos para comprar en Junkerz",
    title: "Pasos para empezar a comprar",
    policy: (v: number) =>
      `Requisitos, versión ${v}. Los documentos opcionales que pedimos no detienen la aprobación.`,
    itemLabels: {
      w9: "W-9",
      license: "Licencia del negocio",
      insurance: "Certificado de seguro",
      id: "Identificación con foto",
      terms: "Firmar los Términos de servicio",
      card: "Tarjeta registrada",
    },
    required: "Obligatorio",
    optional: "Lo pedimos · opcional",
    uploadedReview: "Subido · esperando revisión",
    signed: "Firmado",
    saved: "Guardado",
    reviewed: "Revisado",
    rejected: "Rechazado · suba otro",
    uploaded: "Subido",
    incomplete: "Falta",
    complete: (label: string) => `Completar: ${label}`,
    approved: "Negocio aprobado",
    ready: "Listo para que nuestro equipo lo apruebe",
    pending: "Aprobación del negocio pendiente",
    paymentReady: "Forma de pago lista",
    addPayment: "Agregar una forma de pago",
    inactive: (reason?: string) =>
      `Cuenta inactiva${reason ? `: ${reason}` : ""}. Comuníquese con Junkerz para recibir ayuda.`,
    footer: "Ya puede poner sus precios. Puede ganar carros cuando termine los pasos obligatorios y aprobemos su cuenta.",
  },

  documents: {
    title: "Suba sus documentos",
    intro:
      "Complete los pasos obligatorios para que nuestro equipo lo apruebe. Archivos PDF, PNG o JPG de hasta 10 MB.",
    upload: (label: string) => `Subir: ${label}`,
    replace: (label: string) => `Cambiar: ${label}`,
    uploading: "Subiendo…",
    termsBefore: "Lea los",
    termsLink: "Términos de servicio",
    termsAfter: "(en inglés) antes de aceptar.",
    accept: "Acepto los Términos de servicio",
    loadingChecklist: "Cargando su lista guardada…",
    continue: "Continuar a Inicio",
    skip: "Saltar por ahora",
    footer: "Lo que ya guardó se queda en Inicio. Desde ahí puede regresar a cualquier paso que falte.",
    uploadFailed: "No se pudo subir el archivo",
    termsFailed: "No se pudo guardar su aceptación",
    server: {
      file_too_large: "Ese archivo pesa más de 10 MB. Elija uno más chico.",
      unsupported_extension: "Use un archivo PDF, PNG o JPG.",
      no_file: "Primero elija un archivo.",
      bad_document_type: "No aceptamos ese tipo de documento.",
      upload_failed: "No se pudo subir el archivo",
    },
  },

  dashboard: {
    marketplace: "Mercado",
    wonCars: "Carros ganados",
    bidRules: "Reglas de oferta",
    paymentBefore: "Registre su",
    paymentLink: "forma de pago",
    paymentAfter: "para la comisión de cada recogida.",
    pendingTitle: "Cuenta pendiente de aprobación",
    pendingDefault: "Complete los pasos obligatorios de la lista para que nuestro equipo revise su cuenta.",
    balance: "Saldo disponible",
    reliability: "Puntaje de cumplimiento",
    tier: "Nivel",
    tiers: { standard: "estándar" },
  },

  settings: {
    title: "Ajustes",
    returnLink: "Volver a la recogida para intentar el pago de nuevo",
    returnNote:
      "Vuelva a su recogida terminada y presione “Retry payment” para pagar la comisión pendiente.",
    paymentTitle: "Forma de pago",
    paymentIntro:
      "Guarde una tarjeta para la comisión de cada recogida. Guardar la tarjeta no le cobra nada. Los datos de la tarjeta se ponen de forma segura con Stripe.",
    cardLine: (brand: string, last4: string, month: number, year: number) =>
      `${brand} que termina en ${last4} · Vence ${month}/${year}`,
    onFile: "Ya tiene una forma de pago registrada.",
    noCard: "No tiene tarjeta registrada.",
    saved: "Tarjeta guardada.",
    refreshFailed: "Su tarjeta se guardó, pero no se pudieron actualizar sus datos. Recargue esta página.",
    testMode: "Stripe en modo de prueba — use solo datos de tarjeta de prueba.",
    replaceCard: "Cambiar tarjeta",
    addCard: "Agregar tarjeta",
    unavailable: "No se puede registrar la tarjeta ahora. Comuníquese con el soporte de Junkerz.",
    unavailableShort: "No se puede registrar la tarjeta ahora.",
    loadFailed: "No se pudieron cargar los ajustes de pago.",
    consent:
      "Autorizo a Junkerz a guardar esta tarjeta y a cobrar la comisión que corresponda cuando complete una recogida, conforme a mi contrato de comprador.",
    authFailed: "No se pudo verificar la tarjeta. Intente de nuevo.",
    notComplete: "El registro de la tarjeta no está completo. Intente de nuevo.",
    saveFailed: "No se pudo guardar la tarjeta.",
    secureLoadFailed: "No cargó la entrada segura de la tarjeta. Recargue esta página para intentar de nuevo.",
    saving: "Guardando…",
    saveCard: "Guardar tarjeta",
  },

  rules: {
    title: "Reglas de oferta",
    newRule: "+ Nueva regla",
    empty: "Todavía no tiene reglas de oferta. Cree una para empezar a recibir carros.",
    colName: "Nombre",
    colBid: "Oferta",
    colActive: "Activa",
    colPriority: "Prioridad",
    colNotify: "Avisos",
    colWeek: "Esta semana",
    colFilters: "Filtros",
    ruleN: (id: number) => `Regla ${id}`,
    on: "ACTIVA",
    off: "PAUSADA",
    pauseTitle: "Toque para pausar esta regla",
    activateTitle: "Toque para activar esta regla",
    edit: "Editar",
    clone: "Copiar",
    cloneTitle: "Hacer una copia de esta regla (empieza pausada)",
    delete: "Borrar",
    confirmDelete: "¿Borrar esta regla?",
  },

  ledger: {
    title: "Estado de cuenta",
    empty: "Todavía no hay movimientos.",
    colDate: "Fecha",
    colType: "Tipo",
    colAmount: "Monto",
    colBalance: "Saldo",
    colNotes: "Notas",
    types: {},
  },

  disputes: {
    title: "Reclamos",
    cancel: "Cancelar",
    open: "+ Abrir reclamo",
    matchId: "Número del carro (match ID)",
    matchHelp: "El número está en la página Carros ganados.",
    reason: "Motivo",
    reasons: {
      not_as_described: "no es como lo describieron",
      title_problem: "problema con el título",
      not_delivered: "no se entregó",
      damaged_in_transport: "se dañó en el transporte",
      wrong_vehicle: "vehículo equivocado",
    },
    description: "Descripción (opcional)",
    submitting: "Enviando…",
    submit: "Enviar reclamo",
    empty: "Todavía no hay reclamos.",
    colMatch: "Carro",
    colReason: "Motivo",
    colStatus: "Estado",
    colResolved: "Resuelto",
    colWhen: "Fecha",
    statuses: {
      open: "abierto",
      investigating: "en revisión",
      resolved_buyer: "resuelto a favor del comprador",
      resolved_seller: "resuelto a favor del vendedor",
      closed: "cerrado",
    },
    server: {
      invalid_match: "El número del carro no es válido",
      missing: "Llene el número del carro y el motivo.",
      invalid_reason: "Elija un motivo de la lista.",
      bad_evidence_urls: "No se pudo leer uno de los enlaces de fotos.",
      not_yours: "Ese número no es de uno de sus carros.",
    },
  },

  market: {
    title: "Mercado",
    dashboard: "Inicio",
    intro:
      "Vea los carros disponibles. Su lugar en la fila muestra dónde está en cada uno — las reglas de oferta deciden a qué compradores se les asigna el carro, y el lugar 1 es el que está seleccionado ahora.",
    yearMin: "Año ≥",
    yearMax: "Año ≤",
    make: "Marca",
    condition: "Condición",
    any: "Cualquiera",
    conditions: {
      running: "Camina",
      non_running: "No camina",
      wrecked: "Chocado",
      parts: "Solo para partes",
    },
    zip: "ZIP empieza con",
    searching: "Buscando…",
    search: "Buscar",
    clear: "Borrar filtros",
    empty: "Ahorita no hay carros que coincidan con sus filtros. Pruebe con más años o borre los filtros.",
    vin: "VIN",
    offerPrice: "Precio de oferta",
    titleChip: (s: string) => `Título: ${s}`,
    unknown: "desconocida",
    today: "hoy",
    yesterday: "ayer",
    daysAgo: (d: number) => `hace ${d} días`,
    queue: (n: number) => `${n} comprador${n === 1 ? "" : "es"} en la fila`,
    notInQueue: "No está en la fila",
    youWon: "Usted ganó",
    myStatuses: { declined: "rechazado", expired: "vencido" },
    rank: (n: number) => `Lugar #${n}`,
    showing: (n: number) =>
      `Mostrando ${n} carros disponibles de los últimos 60 días. Ajuste los filtros o regrese después — salen carros nuevos cuando los vendedores aceptan su cotización.`,
  },
};

export function buyerText(lang: Lang): BuyerText {
  return lang === "es" ? es : en;
}

/** Both tables, for the test that checks no word is missing in either language. */
export const BUYER_TEXT_TABLES = { en, es };

/**
 * Words for a server error code: the page's own table first, then a plain
 * "Something went wrong (code)". Raw codes like "HTTP 500" or "Failed to fetch"
 * are never shown on their own.
 */
export function serverWords(
  t: BuyerText,
  table: Record<string, string>,
  code: string | undefined | null,
): string {
  if (code && table[code]) return table[code];
  return t.serverOther(code || "?");
}

/** A checklist item's name: the server's label in English, ours in Spanish. */
export function itemLabel(
  t: BuyerText,
  lang: Lang,
  item: { key: string; label: string },
): string {
  if (lang === "en") return item.label;
  return t.checklist.itemLabels[item.key] ?? item.label;
}
