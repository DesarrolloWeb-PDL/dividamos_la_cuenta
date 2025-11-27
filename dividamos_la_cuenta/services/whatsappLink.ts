import { Linking } from 'react-native';

export function generateWhatsAppLink(phone: string, amount: number, alias: string): string {
    const message = `Hola! Te paso el link para transferir $${amount.toFixed(2)} a mi Alias/CVU: ${alias}. Gracias!`;
    const encodedMessage = encodeURIComponent(message);
    // Remove non-numeric characters from phone
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export async function fetchAlias(participantId: any): Promise<string> {
    // Mock implementation - in a real app this might fetch from a backend or user profile
    // For now, return a placeholder or look up in local storage if we had it
    return 'alias.ejemplo.mp';
}

export function openWhatsApp(url: string): void {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
}
