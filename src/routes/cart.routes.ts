import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../dtos/cart.dto";

const router = Router();

router.use(authMiddleware);

router.get("/", CartController.get);
router.post("/", validate(addToCartSchema), CartController.add);
router.put("/:productId", validate(updateCartItemSchema), CartController.update);
router.delete("/:productId", CartController.remove);
router.delete("/", CartController.clear);

export default router;
