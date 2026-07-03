export const brand = {
  name: "FLOW URBAN WEAR",
  founder: "DANY FLOW",
  founderFull: "Daniela Flores",
  tagline: "LESS THINKING MORE FLOW",
  origin: "Mexico City, Mexico",
  story: "FLOW URBAN WEAR was created by DANY FLOW — a nickname born from Daniela Flores (Flores → Flowers → FLOW). What started as a personal expression became a community-based streetwear brand combining urban culture with a modern edge. FLOW is more than style — it's about self-expression, creativity, and authenticity. The art of letting things happen, without trying to control them.",
  description: "Community-based streetwear combining urban culture with modern edge. Created by DANY FLOW from Mexico City.",
};

export const shippingPolicy = {
  carrier: "DHL",
  national: "5–7 business days",
  cdmx: "4–6 business days",
  international: "10–14 business days",
  origin: "Mexico City",
};

export const refundPolicy = {
  refundWindow: "10 days from receipt",
  exchangeWindow: "7 days from receipt",
  nonReturnable: [
    "Damaged garments",
    "Signs of wear, sweat, or washing",
    "Food stains or makeup marks",
    "Bad smells",
  ],
};

export const privacyTerms = {
  privacy: "We collect personal information necessary for website and service functionality. Your continued use of our site constitutes consent to our data collection practices.",
  terms: "By accessing FLOW URBAN WEAR, you agree to these terms. Non-compliance means no service access or information provision.",
};

// ---------------------------------------------------------------------------
// Spanish page copy — powers the indexable routes (/nosotros, /envios,
// /devoluciones, /privacidad). The English blocks above keep feeding the
// slide-over panels; both coexist until the panels are localized.
// ---------------------------------------------------------------------------

export const contactEmail = "contact@flowurbanwear.com";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Spanish shipping copy (mirrors `shippingPolicy` above). */
export const shippingEs = {
  carrier: "DHL",
  origin: "Ciudad de México",
  cdmx: "4–6 días hábiles",
  national: "5–7 días hábiles",
  international: "10–14 días hábiles",
};

export const shippingFaqEs: FaqItem[] = [
  {
    question: "¿Cuánto tarda en llegar mi pedido?",
    answer:
      "Todos los pedidos salen desde Ciudad de México vía DHL. En CDMX y área metropolitana tardan de 4 a 6 días hábiles, al resto de México de 5 a 7 días hábiles y los envíos internacionales de 10 a 14 días hábiles.",
  },
  {
    question: "¿Hacen envíos internacionales?",
    answer:
      "Sí, enviamos a la mayoría de los países vía DHL con un tiempo estimado de entrega de 10 a 14 días hábiles. Los impuestos o aranceles de importación corren por cuenta del cliente según la normativa de cada país.",
  },
  {
    question: "¿Cuánto cuesta el envío?",
    answer:
      "El costo de envío se calcula al finalizar tu compra según tu dirección de entrega y se muestra antes de pagar, sin cargos ocultos.",
  },
  {
    question: "¿Cómo rastreo mi pedido?",
    answer:
      "Cuando tu paquete sale de nuestro estudio recibes por correo tu número de guía DHL. Con ese número puedes seguir tu pedido en tiempo real en dhl.com o en la app de DHL.",
  },
];

/** Spanish returns/exchanges copy (mirrors `refundPolicy` above). */
export const returnsEs = {
  refundWindow: "10 días naturales a partir de que recibes tu pedido",
  exchangeWindow: "7 días naturales a partir de que recibes tu pedido",
  nonReturnable: [
    "Prendas dañadas por el cliente",
    "Prendas con señales de uso, sudor o lavado",
    "Manchas de comida o maquillaje",
    "Prendas con malos olores (perfume, humo, etc.)",
  ],
};

export const returnsFaqEs: FaqItem[] = [
  {
    question: "¿Cuánto tiempo tengo para devolver una prenda?",
    answer:
      "Tienes 10 días naturales a partir de que recibes tu pedido para solicitar una devolución con reembolso, y 7 días naturales para solicitar un cambio de talla o de producto.",
  },
  {
    question: "¿Qué condiciones debe cumplir la prenda?",
    answer:
      "La prenda debe estar en su estado original: sin usar, sin lavar, sin manchas ni olores, y con sus etiquetas. No aceptamos prendas dañadas, con señales de uso, sudor o lavado, con manchas de comida o maquillaje, ni con malos olores.",
  },
  {
    question: "¿Cómo inicio una devolución o cambio?",
    answer:
      "Escríbenos a contact@flowurbanwear.com con tu número de pedido y el motivo de la devolución o cambio. Te respondemos con las instrucciones y la guía de envío correspondiente.",
  },
  {
    question: "¿Cuándo recibo mi reembolso?",
    answer:
      "Una vez que recibimos e inspeccionamos la prenda, procesamos el reembolso a tu método de pago original. El banco puede tardar algunos días hábiles adicionales en reflejarlo.",
  },
];
