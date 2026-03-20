export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403)
    return next(new Error("Admin access required"))
  }
  next()
}