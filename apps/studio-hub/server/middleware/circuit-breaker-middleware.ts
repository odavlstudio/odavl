// Circuit Breaker tRPC Middleware
// Location: apps/studio-hub/server/middleware/circuit-breaker-middleware.ts

import { TRPCError } from "@trpc/server";
import { circuitBreakerRegistry, CircuitBreakerError } from "../../lib/circuit-breaker";

/**
 * Circuit breaker configuration for external services
 */
const SERVICE_CONFIGS = {
  github: {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    openDuration: 30000,
  },
  stripe: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000,
    openDuration: 60000,
  },
  contentful: {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 8000,
    openDuration: 30000,
  },
  sentry: {
    failureThreshold: 10,
    successThreshold: 3,
    timeout: 5000,
    openDuration: 15000,
  },
  openai: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
    openDuration: 60000,
  },
};

/**
 * Circuit Breaker Middleware for tRPC
 * 
 * Wraps external API calls with circuit breaker protection
 * 
 * @example
 * ```typescript
 * import { withCircuitBreaker } from "../middleware/circuit-breaker-middleware";
 * 
 * export const githubRouter = router({
 *   getUser: procedure
 *     .use(withCircuitBreaker("github"))
 *     .input(z.object({ username: z.string() }))
 *     .query(async ({ input, ctx }) => {
 *       // This call is protected by circuit breaker
 *       return await ctx.githubClient.getUser(input.username);
 *     }),
 * });
 * ```
 */
export function withCircuitBreaker(serviceName: keyof typeof SERVICE_CONFIGS) {
  return async function circuitBreakerMiddleware({
    next,
  }: {
    next: () => Promise<unknown>;
  }) {
    const config = SERVICE_CONFIGS[serviceName];
    const breaker = circuitBreakerRegistry.getBreaker(serviceName, config);
    
    try {
      // Execute the next middleware/procedure with circuit breaker protection
      const result = await breaker.execute(async () => {
        return await next();
      });
      
      return result;
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        // Circuit breaker is open - return user-friendly error
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: `${serviceName} service is temporarily unavailable. Please try again later.`,
          cause: error,
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Circuit Breaker Health Check Procedure
 * 
 * Returns the status of all circuit breakers
 */
export function getCircuitBreakerHealth() {
  const metrics = circuitBreakerRegistry.getAllMetrics();
  
  return {
    healthy: Object.values(metrics).every((m) => m.state === "closed"),
    breakers: metrics,
  };
}
