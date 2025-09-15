// src/utils/validaciones.ts

/** Validar fortaleza de contraseña */
export const validarContraseña = (
  contraseña: string
): { valida: boolean; mensaje?: string } => {
  if (contraseña.length < 8) {
    return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contraseña)) {
    return {
      valida: false,
      mensaje:
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número.'
    };
  }

  return { valida: true };
};

/** Validar nombre de usuario */
export const validarUsuario = (
  usuario: string
): { valido: boolean; mensaje?: string } => {
  if (usuario.length < 3 || usuario.length > 20) {
    return { valido: false, mensaje: 'El usuario debe tener entre 3 y 20 caracteres.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
    return {
      valido: false,
      mensaje: 'El usuario solo puede contener letras, números y guiones bajos.'
    };
  }

  return { valido: true };
};
