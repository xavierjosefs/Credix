export const isValidCedula = (cedula) => {
    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    return cedulaRegex.test(cedula);
};
//# sourceMappingURL=cedula.js.map