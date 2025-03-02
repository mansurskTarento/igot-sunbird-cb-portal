import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ws-app-events-calendar',
  templateUrl: './events-calendar.component.html',
  styleUrls: ['./events-calendar.component.scss']
})
export class EventsCalendarComponent implements OnInit {

  @Input() eventsList: any

  selected = new Date();
  currentMonth = new Date();
  daysInMonth: Date[] = [];
  weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Highlighted dates (events)
  eventDates = [15, 20, 24, 26];
  
  constructor(private datePipe: DatePipe) {}
  
  ngOnInit() {
    this.generateCalendarDays();
  }
  
  generateCalendarDays() {
    this.daysInMonth = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Add padding for days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      this.daysInMonth.unshift(prevDate);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      this.daysInMonth.push(new Date(year, month, i));
    }
    
    // Add padding for days from next month
    const remaining = 42 - this.daysInMonth.length; // 6 rows × 7 days
    for (let i = 1; i <= remaining; i++) {
      this.daysInMonth.push(new Date(year, month + 1, i));
    }
  }
  
  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendarDays();
  }
  
  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendarDays();
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }
  
  hasEvent(date: Date): boolean {
    return this.isCurrentMonth(date) && this.eventDates.includes(date.getDate());
  }
  
  selectDate(date: Date) {
    this.selected = date;
    // Handle date selection - perhaps emit an event to parent component
  }
  
  get getMonthYearText(): string {
    return this.datePipe.transform(this.currentMonth, 'MMM yyyy') as string;
  }

}
