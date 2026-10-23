import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripsComponent } from './trips.component';

describe('TripsComponent', () => {
  let component: TripsComponent;
  let fixture: ComponentFixture<TripsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TripsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and list 3 seeded travel packages', () => {
    expect(component).toBeTruthy();
    expect(component.data.trips().length).toBe(3);
  });

  it('should add a new travel package when saved', () => {
    component.openNewTrip();
    component.form.title = '3-Day Temple Trail';
    component.form.days = 3;
    component.form.price = 3499;
    component.saveTrip();
    expect(component.data.trips().length).toBe(4);
  });
});