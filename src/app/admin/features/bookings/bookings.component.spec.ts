import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingsComponent } from './bookings.component';

describe('BookingsComponent', () => {
  let component: BookingsComponent;
  let fixture: ComponentFixture<BookingsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BookingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and list seeded bookings', () => {
    expect(component).toBeTruthy();
    expect(component.filteredBookings().length).toBeGreaterThan(0);
  });

  it('should filter bookings by status', () => {
    component.statusFilter.set('Pending');
    expect(component.filteredBookings().every(b => b.status === 'Pending')).toBeTrue();
  });
});