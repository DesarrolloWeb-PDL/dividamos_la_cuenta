// Tests para whatsappLink.js
const { generateWhatsAppLink } = require('./whatsappLink');

describe('Generador de link de WhatsApp', () => {
  it('genera el link correctamente', () => {
    const phone = '5491111111111';
    const amount = 1500;
    const alias = 'mi.alias.mp';
    const url = generateWhatsAppLink(phone, amount, alias);
    expect(url).toContain('https://wa.me/5491111111111');
    const params = new URL(url).searchParams;
    const text = params.get('text');
    expect(decodeURIComponent(text)).toContain('transferir $1500 a mi Alias/CVU: mi.alias.mp');
  });
});
