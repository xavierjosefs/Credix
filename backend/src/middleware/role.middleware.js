export const requireAdmin = (req, res, next) => {
    //vertificar que existe el usuario
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    //verificar el rol
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Forbidden: Admins only",
        });
    }
    next();
};
//# sourceMappingURL=role.middleware.js.map