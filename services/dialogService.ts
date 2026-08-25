import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export async function confirmAction({
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  destructive = false,
}: ConfirmOptions) {
  if (Platform.OS === 'web' && typeof globalThis.confirm === 'function') {
    return globalThis.confirm([title, message].filter(Boolean).join('\n\n'));
  }

  return new Promise<boolean>(resolve => {
    let isResolved = false;

    const finish = (value: boolean) => {
      if (!isResolved) {
        isResolved = true;
        resolve(value);
      }
    };

    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => finish(false),
        },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => finish(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => finish(false),
      },
    );
  });
}