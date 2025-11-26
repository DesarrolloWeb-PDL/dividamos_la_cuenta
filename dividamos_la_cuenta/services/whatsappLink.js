// Generador de deep link de WhatsApp para solicitar pago
const axios = require('axios');

async function fetchAlias(receiverId) {
  // Simulación de endpoint seguro
  const response = await axios.get(`https://api.miservidor.com/alias/${receiverId}`);
  return response.data.alias;
}

function generateWhatsAppLink(phone, amount, alias) {
  const message = encodeURIComponent(`Hola! Te pido por favor transferir $${amount} a mi Alias/CVU: ${alias} (App Dividamos la Cuenta)`);
  return `https://wa.me/${phone}?text=${message}`;
}

// La función openWhatsApp se exporta solo en entorno nativo
let openWhatsApp = undefined;
try {
  const Linking = require('expo-linking');
  openWhatsApp = function(url) {
    Linking.openURL(url);
  };
} catch (e) {
  // No disponible en entorno de test
}

module.exports = {
  fetchAlias,
  generateWhatsAppLink,
  openWhatsApp,
};
