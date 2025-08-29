import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DssPanelComponent } from './dss-panel.component';

describe('DssPanelComponent', () => {
  let component: DssPanelComponent;
  let fixture: ComponentFixture<DssPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DssPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DssPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
