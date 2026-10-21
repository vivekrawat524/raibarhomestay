import { TestBed } from '@angular/core/testing';

import { LangserviceService } from './langservice.service';

describe('LangserviceService', () => {
  let service: LangserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LangserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
