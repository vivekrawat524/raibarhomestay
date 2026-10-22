import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomsComponent } from './rooms.component';

describe('RoomsComponent', () => {
  let component: RoomsComponent;
  let fixture: ComponentFixture<RoomsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RoomsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display 5 rooms', () => {
    expect(component).toBeTruthy();
    expect(component.data.rooms().length).toBe(5);
  });

  it('should add a new room when saved', () => {
    component.openNewRoom();
    component.form.name = 'Attic Sky Room';
    component.form.price = 1400;
    component.saveRoom();
    expect(component.data.rooms().length).toBe(6);
  });
});