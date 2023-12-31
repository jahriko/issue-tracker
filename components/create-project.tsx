"use client"
import { createProject } from "@/actions/formAction"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const projectNameSchema = z.object({
  title: z.string().min(2, { message: "Project name is required." }).max(40),
})

type ProjectName = z.infer<typeof projectNameSchema>

export function CreateProject() {
  const [open, setOpen] = useState(false)

  const form = useForm<ProjectName>({
    resolver: zodResolver(projectNameSchema),
    defaultValues: {
      title: "",
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form
            id="createProjectFormId"
            action={async (formData: FormData) => {
              const valid = await form.trigger()
              if (!valid) return
              setOpen(false)
              return createProject(formData)
            }}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel htmlFor="project-name">Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="createProjectFormId" className="w-full">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
