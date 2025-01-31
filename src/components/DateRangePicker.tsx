import { Calendar } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    isCalendarOpen: boolean;
    setIsCalendarOpen: (open: boolean) => void;
}

export function DateRangePicker({ date, setDate, isCalendarOpen, setIsCalendarOpen }: DateRangePickerProps) {
    let dateDisplay = '날짜 범위 선택';
    if (date?.from) {
        dateDisplay = `${format(date.from, 'yyyy-MM-dd')}`;
        if (date.to) {
            dateDisplay += ` ~ ${format(date.to, 'yyyy-MM-dd')}`;
        }
    }

    return (
        <Popover.Root open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <Popover.Trigger asChild>
                <button className="w-full px-4 py-2 text-left border rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500">
                   <span className="flex items-center">
                       <Calendar className="w-4 h-4 mr-2" />
                       {dateDisplay}
                   </span>
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className="bg-white rounded-md shadow-lg p-2" sideOffset={5}>
                    <DayPicker
                        mode="range"
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        className="border rounded-md bg-white"
                        modifiersStyles={{
                            selected: {
                                backgroundColor: '#3b82f6',
                                color: 'white'
                            },
                            today: {
                                backgroundColor: '#eff6ff',
                                color: '#1e40af'
                            }
                        }}
                        showOutsideDays={true}
                        fixedWeeks={true}
                        fromMonth={new Date()}
                        disabled={{ before: new Date() }}
                        defaultMonth={new Date()}
                        captionLayout="dropdown"
                        styles={{
                            caption: { color: '#374151' },
                            head_cell: { color: '#6B7280' },
                            cell: { width: '40px', height: '40px' },
                            nav: { color: '#374151' },
                            nav_button_previous: { marginRight: '8px' },
                            nav_button_next: { marginLeft: '8px' }
                        }}
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => setIsCalendarOpen(false)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                            닫기
                        </button>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}