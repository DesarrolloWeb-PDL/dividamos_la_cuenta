export type PaymentHandleKind = 'alias' | 'cvu' | 'link';

const PAYMENT_LINK_DOMAINS = ['mercadopago.com', 'mpago.la', 'link.mercadopago.com'];

export function detectPaymentHandleKind(paymentHandle?: string): PaymentHandleKind {
  const normalizedHandle = paymentHandle?.trim() ?? '';

  if (!normalizedHandle) {
    return 'alias';
  }

  const lowerHandle = normalizedHandle.toLowerCase();

  if (
    lowerHandle.startsWith('http://')
    || lowerHandle.startsWith('https://')
    || lowerHandle.includes('mercadopago.com')
    || lowerHandle.includes('mpago.la')
  ) {
    return 'link';
  }

  const digitsOnly = normalizedHandle.replace(/\D/g, '');

  if (digitsOnly.length >= 16 && digitsOnly.length === normalizedHandle.length) {
    return 'cvu';
  }

  return 'alias';
}

export function validatePaymentHandle(paymentHandle?: string) {
  const normalizedHandle = paymentHandle?.trim() ?? '';

  if (!normalizedHandle) {
    return null;
  }

  const kind = detectPaymentHandleKind(normalizedHandle);

  if (kind === 'link') {
    try {
      const parsedUrl = new URL(normalizedHandle);
      const hasAllowedDomain = PAYMENT_LINK_DOMAINS.some(domain => parsedUrl.hostname.includes(domain));

      if (!hasAllowedDomain) {
        return 'El link de cobro tiene que ser un enlace válido de Mercado Pago.';
      }

      return null;
    } catch {
      return 'El link de cobro no tiene un formato de URL válido.';
    }
  }

  if (kind === 'cvu') {
    const digitsOnly = normalizedHandle.replace(/\D/g, '');

    if (digitsOnly.length < 16 || digitsOnly.length > 22) {
      return 'El CVU/CBU debería tener entre 16 y 22 dígitos.';
    }

    return null;
  }

  const aliasPattern = /^[a-zA-Z0-9._-]{6,}$/;

  if (!aliasPattern.test(normalizedHandle)) {
    return 'El alias debería tener al menos 6 caracteres y usar letras, números, punto, guion o guion bajo.';
  }

  return null;
}

export function getPaymentHandleLabel(paymentHandle?: string) {
  const kind = detectPaymentHandleKind(paymentHandle);

  if (kind === 'link') {
    return 'Link de cobro';
  }

  if (kind === 'cvu') {
    return 'CVU/CBU';
  }

  return 'Alias';
}

export function formatPaymentHandleForMessage(paymentHandle?: string) {
  const normalizedHandle = paymentHandle?.trim();

  if (!normalizedHandle) {
    return null;
  }

  return `${getPaymentHandleLabel(normalizedHandle)}: ${normalizedHandle}`;
}