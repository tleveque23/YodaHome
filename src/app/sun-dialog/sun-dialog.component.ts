import { Component, Inject, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-sun-dialog',
  templateUrl: './sun-dialog.component.html',
  styleUrls: ['./sun-dialog.component.less']
})
export class SunDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<SunDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
