"use client"

import { useActionState, useId, useState } from "react"
import { nl } from "react-day-picker/locale"
import { CalendarIcon, CircleCheck, ClockIcon } from "lucide-react"

import { createReservation } from "@/app/maak-een-afspraak/actions"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { honeypotField, initialReservationState } from "@/lib/reservation"
import { bookingWindow, serviceOptions } from "@/lib/site"

// The shadcn Input/Textarea default to a compact height meant for dense UI; a
// public booking form wants a comfortable tap target instead.
const controlClassName = "h-11 rounded-lg px-3"

// The three pickers stand next to the plain inputs, so they borrow the Input's
// height, radius and type scale rather than keeping the button defaults.
const triggerClassName =
  "h-11 w-full justify-between rounded-lg px-3 text-base font-normal md:text-sm"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

/** Quarter-hour slots spanning every hour the salon is ever open, from the
 *  earliest opening time in content.yml to a quarter of an hour before the
 *  latest closing time. Derived rather than hard-coded, so moving a closing
 *  time in content.yml moves the last bookable slot with it. */
const timeSlots = (() => {
  const first = Math.ceil(bookingWindow.earliest / 15) * 15
  const last = Math.floor((bookingWindow.latest - 15) / 15) * 15

  return Array.from({ length: Math.max(0, (last - first) / 15 + 1) }, (_, index) => {
    const minutes = first + index * 15
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
  })
})()

/** Midnight today, so the calendar offers the same days the Server Action
 *  accepts. Called at click time rather than module load, so a tab left open
 *  overnight does not keep yesterday selectable. */
function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** The `yyyy-mm-dd` the Server Action parses. Built from the local parts on
 *  purpose: toISOString() would shift to UTC and, east of Greenwich, hand back
 *  the previous day. */
function toDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null

  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

export function ReservationForm() {
  const [state, formAction, pending] = useActionState(
    createReservation,
    initialReservationState
  )
  const formId = useId()

  // The three pickers are Radix components rather than native controls, so
  // their values live here and ride along in hidden inputs (the Select bubbles
  // its own). All three are validated server-side, which the form needs anyway
  // — a Server Action is reachable by direct POST.
  const [service, setService] = useState("")
  const [date, setDate] = useState<Date>()
  const [dateOpen, setDateOpen] = useState(false)
  const [time, setTime] = useState("")
  const [timeOpen, setTimeOpen] = useState(false)

  const fieldId = (name: string) => `${formId}-${name}`
  const errorId = (name: string) => `${formId}-${name}-error`
  const errorProps = (name: string) =>
    state.fieldErrors[name]
      ? { "aria-invalid": true, "aria-describedby": errorId(name) }
      : {}

  if (state.status === "success") {
    return (
      // The confirmation is the one panel on the site with a filled background:
      // it replaces a whole form, so it has to look like something happened.
      <div className="rounded-xl border border-brand-line bg-brand-soft p-6 sm:p-8">
        <CircleCheck className="size-6 text-brand-ink" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-medium tracking-tight">
          Aanvraag verstuurd
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {state.message}
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* A bot fills in every field it finds; nobody else can see this one.
          `hidden` keeps it out of the page and away from screen readers, and
          the negative tabIndex out of the keyboard path. The Server Action
          drops any submission that arrives with it set. */}
      <div hidden aria-hidden="true">
        <Label htmlFor={fieldId(honeypotField)}>Website</Label>
        <Input
          id={fieldId(honeypotField)}
          name={honeypotField}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("name")}>Naam</Label>
          <Input
            id={fieldId("name")}
            name="name"
            autoComplete="name"
            required
            className={controlClassName}
            {...errorProps("name")}
          />
          <FieldError id={errorId("name")} message={state.fieldErrors.name} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("email")}>E-mail</Label>
          <Input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            className={controlClassName}
            {...errorProps("email")}
          />
          <FieldError id={errorId("email")} message={state.fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("phone")}>Telefoon</Label>
          <Input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            className={controlClassName}
            {...errorProps("phone")}
          />
          <FieldError id={errorId("phone")} message={state.fieldErrors.phone} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("service")}>Behandeling</Label>
          <Select name="service" value={service} onValueChange={setService}>
            <SelectTrigger
              id={fieldId("service")}
              className={cn(triggerClassName, "h-11!")}
              {...errorProps("service")}
            >
              <SelectValue placeholder="Kies een behandeling" />
            </SelectTrigger>
            <SelectContent className="min-w-(--radix-select-trigger-width)">
              {serviceOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError
            id={errorId("service")}
            message={state.fieldErrors.service}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("date")}>Datum</Label>
          {/* The whole trigger is the button, so a click anywhere on it opens
              the calendar — not just the icon, the way a native date input
              behaves. */}
          <input type="hidden" name="date" value={date ? toDateValue(date) : ""} />
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id={fieldId("date")}
                type="button"
                variant="outline"
                className={cn(triggerClassName, !date && "text-muted-foreground")}
                {...errorProps("date")}
              >
                {date ? formatDateLabel(date) : "Kies een datum"}
                <CalendarIcon className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(next) => {
                  setDate(next)
                  setDateOpen(false)
                }}
                disabled={{ before: startOfToday() }}
                startMonth={startOfToday()}
                locale={nl}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <FieldError id={errorId("date")} message={state.fieldErrors.date} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("time")}>Tijd</Label>
          <input type="hidden" name="time" value={time} />
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                id={fieldId("time")}
                type="button"
                variant="outline"
                className={cn(triggerClassName, !time && "text-muted-foreground")}
                {...errorProps("time")}
              >
                <span className="tabular-nums">{time || "Kies een tijd"}</span>
                <ClockIcon className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div
                role="listbox"
                aria-label="Tijd"
                className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto pr-1"
              >
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    role="option"
                    aria-selected={slot === time}
                    // The chosen slot is orange rather than black: it is the
                    // one filled thing in a grid of forty, and the same fill
                    // the submit button below it wears.
                    variant={slot === time ? "brand" : "ghost"}
                    className="h-9 justify-center tabular-nums"
                    onClick={() => {
                      setTime(slot)
                      setTimeOpen(false)
                    }}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <FieldError id={errorId("time")} message={state.fieldErrors.time} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("notes")}>
          Opmerkingen{" "}
          <span className="font-normal text-muted-foreground">(optioneel)</span>
        </Label>
        <Textarea
          id={fieldId("notes")}
          name="notes"
          rows={4}
          maxLength={500}
          className="rounded-lg px-3 py-2.5"
          {...errorProps("notes")}
        />
        <FieldError id={errorId("notes")} message={state.fieldErrors.notes} />
      </div>

      {state.status === "error" && state.message ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : (
        <p aria-live="polite" className="sr-only" />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          variant="brand"
          disabled={pending}
          className="h-12 w-full rounded-xl px-8 text-base sm:w-auto"
        >
          {pending ? "Versturen…" : "Verstuur aanvraag"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Je aanvraag is pas definitief zodra wij hem bevestigen.
        </p>
      </div>
    </form>
  )
}
