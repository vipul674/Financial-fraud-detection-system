import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import alertsRouter from "./alerts";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(alertsRouter);
router.use(analyticsRouter);

export default router;
