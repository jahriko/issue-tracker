"use server"

import prisma from "@/lib/prisma"
import { action } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"
import { z } from "zod"
const schema = z.object({
  id: z.number(), // This is only for optimistic update
  name: z.string(),
  color: z.string(),
})

export const createLabel = action
  .schema(schema)
  .action(async ({ parsedInput: { id, name, color } }) => {
    try {
      await prisma.label.create({
        data: {
          name,
          color,
        },
      })

      return {
        success: true,
      }
    } catch (e) {
      console.error("Error creating a label: ", e)
      return {
        error: {
          message: "Failed to create label",
        },
      }
    } finally {
      // revalidateTag("labels")
      revalidatePath("/(platform)/(home)/[workspaceId]/[projectId]", "page")

      // revalidatePath("/app/%28platform%29/%28home%29/%5BworkspaceId%5D/%5BprojectId%5D")
    }
  })