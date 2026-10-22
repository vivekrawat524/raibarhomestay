import { TestBed } from '@angular/core/testing';
import { AdminDataService } from './admin-data.service';
import { dayOffset } from './admin.seed';

describe('AdminDataService', () => {
  let service: AdminDataService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminDataService);
  });

  it('should seed 5 rooms by default', () => {
    expect(service.rooms().length).toBe(5);
  });

  it('should detect overlapping dates on a confirmed room booking', () => {
    const today = dayOffset(0);
    const tomorrow = dayOffset(1);
    // Room 1 is confirmed for [today, today+2) in seed data
    expect(service.hasRoomConflict(1, today, tomorrow)).toBeTrue();
  });

  it('should allow check-in on the exact day another booking checks out', () => {
    const checkoutDay = dayOffset(2);
    const nextDay = dayOffset(3);
    expect(service.hasRoomConflict(1, checkoutDay, nextDay)).toBeFalse();
  });

  it('should prevent confirming a duplicate overlapping booking', () => {
    const today = dayOffset(0);
    const added = service.addBooking({
      guestName: 'Test Guest',
      phone: '+919999999999',
      guests: 2,
      roomId: 1,
      checkIn: today,
      checkOut: dayOffset(2),
      status: 'Pending',
      source: 'Phone'
    });
    expect(added.ok).toBeTrue();

    const confirmResult = service.updateBookingStatus(added.booking!.id, 'Confirmed');
    expect(confirmResult.ok).toBeFalse();
    expect(confirmResult.error).toContain('already booked');
  });
});