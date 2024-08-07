import { useState } from "react"
import { toggle } from "radash"
import { useFormContext } from "react-hook-form"
import { CheckIcon } from "@radix-ui/react-icons"
import { Tag } from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Command,
  CommandSeparator,
} from "@/components/ui/command"
import { Labels } from "@/app/(platform)/(home)/layout"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FormField, FormItem, FormControl } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IssueLabelsData } from "@/server/data/many/get-issue-labels"
import { LabelsData } from "@/server/data/many/get-labels"

export function LabelBox({ issueLabels }: { issueLabels: IssueLabelsData }) {
  const { control, setValue } = useFormContext()
  // const [background, setBackground] = useState("#B4D455")

  const [selectedValues, setSelectedValues] = useState<LabelsData>([])

  return (
    <FormField
      control={control}
      name="labels"
      render={() => (
        <FormItem className="flex flex-col">
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button className="h-auto p-0" variant="link">
                  <Tag className="size-4" />
                  {selectedValues.length > 0 && (
                    <>
                      <Separator className="mr-2 h-4" orientation="vertical" />
                      <Badge
                        className="rounded-sm px-1 font-normal lg:hidden"
                        variant="secondary"
                      >
                        {selectedValues.length}
                      </Badge>
                      <div className="hidden space-x-1 lg:flex">
                        {selectedValues.length > 3 ? (
                          <Badge
                            className="rounded-sm px-1 font-normal"
                            variant="secondary"
                          >
                            {selectedValues.length}
                          </Badge>
                        ) : (
                          issueLabels
                            .filter((label) =>
                              selectedValues.find(
                                (value) =>
                                  value.name.toLowerCase() ===
                                  label.name.toLowerCase(),
                              ),
                            )
                            .map((label) => (
                              <Badge
                                className="rounded-sm px-1 font-normal"
                                key={label.name}
                                variant="secondary"
                              >
                                {label.name}
                              </Badge>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Command>
                <CommandInput placeholder="Label" />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {issueLabels.map((l) => {
                      const isSelected = selectedValues.find(
                        (label) =>
                          label.name.toLowerCase() === l.name.toLowerCase(),
                      )
                      return (
                        <CommandItem
                          key={l.name.toLowerCase()}
                          onSelect={(value: string) => {
                            const index = issueLabels.find(
                              (label) => label.name.toLowerCase() === value,
                            )
                            const newSelectedValues = toggle(
                              selectedValues,
                              index,
                            )
                            setSelectedValues(
                              newSelectedValues.filter(
                                (value): value is Labels => value !== undefined,
                              ),
                            )
                            setValue("labels", newSelectedValues)
                          }}
                          value={l.name.toLowerCase()}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          <span className="inline-flex items-center gap-x-1.5  px-2 py-1 text-xs font-medium text-green-700">
                            <svg
                              aria-hidden="true"
                              className="size-2"
                              fill={l.color}
                              viewBox="0 0 6 6"
                            >
                              <circle cx={3} cy={3} r={3} />
                            </svg>
                            {l.name}
                          </span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {/* NOTE: Add Picker */}
                  {/* <CommandGroup>
                    <CommandItem>
                      <Picker
                        background={background}
                        setBackground={setBackground}
                      />
                    </CommandItem>
                  </CommandGroup> */}
                  {selectedValues.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          className="justify-center text-center"
                          onSelect={() => {
                            selectedValues.clear()
                            setValue("label", "")
                          }}
                        >
                          Clear
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  )
}
