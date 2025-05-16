import rateLimit from 'express-rate-limit'
import { ALLOWED_ORIGINS } from './envs'

export const rateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 30, // limit each IP to 30 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: 'Too many requests from this IP, please try again after 1 minute'
})

export const corsOptions = {
	origin: ALLOWED_ORIGINS ? ALLOWED_ORIGINS.split(',') : '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
	maxAge: 86400 // 24 hours
}
