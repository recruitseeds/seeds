import { z } from "zod";

const phoneRegex = /^[+]?[\d\s()\-]*/;

export const basicInfoSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }).max(100),
  lastName: z.string().min(1, { message: "Last name is required." }).max(100),
  phoneNumber: z
    .string()
    .regex(phoneRegex, { message: "Invalid phone number format." })
    .max(30)
    .optional()
    .or(z.literal("")),
  location: z.string().max(150).optional().or(z.literal("")),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;
