import { TestBed } from '@angular/core/testing';

import { EcobeService } from './ecobe.service';

describe('EcobeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EcobeService = TestBed.get(EcobeService);
    expect(service).toBeTruthy();
  });
});
