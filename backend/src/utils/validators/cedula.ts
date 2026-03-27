export const isValidCedula = (cedula: string): boolean => {
    
    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    return cedulaRegex.test(cedula);
}