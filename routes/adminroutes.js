import express from "express"
import { verifyToken } from "../middleware/authMiddleware.js"
import { requireAdmin } from "../middleware/roleMiddleware.js"
import {
  getOverviewStats,
  listUsers,
  updateUserRole,
  listAllLoginLogs,
  listBlacklist,
  addBlacklistEntry,
  removeBlacklistEntry
} from "../controllers/adminController.js"

const router = express.Router()

router.use(verifyToken, requireAdmin)

router.get("/stats", getOverviewStats)
router.get("/users", listUsers)
router.patch("/users/:id/role", updateUserRole)
router.get("/login-logs", listAllLoginLogs)
router.get("/blacklist", listBlacklist)
router.post("/blacklist", addBlacklistEntry)
router.delete("/blacklist", removeBlacklistEntry)

export default router
