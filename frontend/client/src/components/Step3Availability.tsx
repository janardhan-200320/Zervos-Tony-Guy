import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Calendar } from '@/components/ui/calendar';

const timezones = [
  'Asia/Kolkata - IST (+05:30)',
  'America/New_York - EST (-05:00)',
  'America/Los_Angeles - PST (-08:00)',
  'Europe/London - GMT (+00:00)',
  'Europe/Paris - CET (+01:00)',
  'Asia/Tokyo - JST (+09:00)',
  'Australia/Sydney - AEDT (+11:00)',
];

const timeSlots = [
  '12:00 am', '01:00 am', '02:00 am', '03:00 am', '04:00 am', '05:00 am',
  '06:00 am', '07:00 am', '08:00 am', '09:00 am', '10:00 am', '11:00 am',
  '12:00 pm', '01:00 pm', '02:00 pm', '03:00 pm', '04:00 pm', '05:00 pm',
  '06:00 pm', '07:00 pm', '08:00 pm', '09:00 pm', '10:00 pm', '11:00 pm',
];

const daysOfWeek = [
  { short: 'Sun', full: 'Sunday' },
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
];

export default function Step3Availability() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();
  const [timezone, setTimezone] = useState(data.timezone);
  const [startTime, setStartTime] = useState(data.availableTimeStart);
  const [endTime, setEndTime] = useState(data.availableTimeEnd);
  // Interpret existing availableDays as ISO date strings, if any
  const initialDates = useMemo(
    () => (data.availableDays || [])
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime())),
    [data.availableDays]
  );
  const [selectedDates, setSelectedDates] = useState<Date[]>(initialDates);
  // Quick weekday toggles (0 = Sunday, 6 = Saturday)
  const initialWeekdays = useMemo(() => {
    const set = new Set<number>();
    initialDates.forEach((d) => set.add(d.getDay()));
    return Array.from(set);
  }, [initialDates]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(initialWeekdays);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  const isFormValid = Boolean(timezone && startTime && endTime && (selectedDates.length > 0 || selectedWeekdays.length > 0));

  const toggleWeekday = (dayIndex: number) => {
    setSelectedWeekdays((prev) => {
      if (prev.includes(dayIndex)) return prev.filter((d) => d !== dayIndex);
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  // When weekday toggles are used but no explicit dates are selected,
  // we'll map weekdays to the next two weeks' dates when saving.
  const mapWeekdaysToDates = (weekdays: number[]) => {
    const daysToGenerate = 14; // two weeks
    const out: Date[] = [];
    const today = new Date();
    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (weekdays.includes(d.getDay())) out.push(d);
    }
    return out;
  };

  const handleNext = () => {
    const daysToStore = selectedDates.length > 0 ? selectedDates : mapWeekdaysToDates(selectedWeekdays);
    updateData({
      timezone,
      availableTimeStart: startTime,
      availableTimeEnd: endTime,
      // store as YYYY-MM-DD strings
      availableDays: daysToStore.map((d) => d.toISOString().slice(0, 10)),
    });
    nextStep();
  };

  const handleBack = () => {
    const daysToStore = selectedDates.length > 0 ? selectedDates : mapWeekdaysToDates(selectedWeekdays);
    updateData({
      timezone,
      availableTimeStart: startTime,
      availableTimeEnd: endTime,
      availableDays: daysToStore.map((d) => d.toISOString().slice(0, 10)),
    });
    prevStep();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Your available times <span className="text-destructive">*</span>
        </h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-medium">
            Time zone
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone" data-testid="select-timezone" className="h-11">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Your available times</Label>
          <div className="flex gap-4">
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger data-testid="select-start-time" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger data-testid="select-end-time" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Pick available dates</Label>

          <div className="rounded-md border p-4 flex gap-6 items-start">
            <div className="w-90">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {daysOfWeek.map((d, idx) => (
                  <button
                    key={d.full}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    title={d.full}
                    className={`px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50 focus:outline-none text-center min-w-[72px] ${
                      selectedWeekdays.includes(idx)
                        ? 'bg-primary text-black border-primary border-2 font-bold'
                        : 'text-foreground'
                    }`}
                  >
                    {d.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex justify-end">
              <div className="w-full max-w-[520px]">
                <div className="flex items-start gap-4">
                  <div className="flex-1" />
                      <div className="relative">
                        <div className="flex justify-end mb-2">
                          <button
                            type="button"
                            onClick={() => setShowCalendar((s) => !s)}
                            className="px-3 py-2 border rounded text-sm bg-white hover:bg-gray-50"
                          >
                            Calender
                          </button>
                        </div>

                        {showCalendar && (
                          <div className="absolute right-0 z-20">
                            <div className="rounded-md shadow-lg bg-white p-3">
                              <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={(dates) => setSelectedDates(dates ?? [])}
                                className="rounded-md w-80"
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex justify-end">
                          <div className="border rounded-md p-3 w-44">
                            <div className="flex items-center gap-2">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M8 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                              <div className="text-sm">
                                <div className="font-medium">{selectedDates.length > 0 ? `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected` : selectedWeekdays.length > 0 ? `${selectedWeekdays.length} day${selectedWeekdays.length > 1 ? 's' : ''} selected` : 'No dates selected'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          data-testid="button-back"
          className="min-w-32"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          data-testid="button-next"
          className="min-w-32"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
